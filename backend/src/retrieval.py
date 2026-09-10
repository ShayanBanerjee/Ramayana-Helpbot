"""Hybrid retrieval: BM25 keyword search + Chroma vector search, merged and
re-ranked by a cross-encoder.

Pure vector similarity alone tends to miss exact-name lookups ("Kumbhakarna",
"Vibhishana") when the embedding model wasn't trained heavily on Indic proper
nouns, and it can't distinguish "mentions this term" from "is actually about
this term" as precisely as a cross-encoder that reads the query and the
passage together. Combining BM25 (keyword recall) + vector search (semantic
recall) + cross-encoder re-ranking (precision) is the standard way to raise
both recall and precision over naive top-k vector search.
"""
import math
import re
from typing import List, Tuple

from langchain_core.documents import Document
from rank_bm25 import BM25Okapi

# \w plus the Devanagari Unicode block, so Sanskrit/Hindi terms tokenize
# as words instead of being dropped by a latin-only \w match.
_TOKEN_RE = re.compile(r"[\wऀ-ॿ]+")


def _tokenize(text: str) -> List[str]:
    return _TOKEN_RE.findall(text.lower())


def _fetch_all_documents(vectorstore, page_size: int = 1000) -> List[Document]:
    """Paginates through the whole collection rather than one unbounded
    .get() call — Chroma's SQLite backend has a hard cap on SQL variables
    per query, which an unpaginated fetch exceeds once the corpus reaches
    tens of thousands of chunks (hit in practice at ~29,000 chunks across
    an 11-book corpus, with "too many SQL variables").
    """
    docs: List[Document] = []
    offset = 0
    while True:
        raw = vectorstore.get(include=["documents", "metadatas"], limit=page_size, offset=offset)
        texts = raw.get("documents") or []
        if not texts:
            break
        metas = raw.get("metadatas") or []
        docs.extend(Document(page_content=t, metadata=m or {}) for t, m in zip(texts, metas))
        offset += len(texts)
    return docs


class HybridIndex:
    """Combines a BM25 keyword index with the Chroma vector store, and
    re-ranks the merged candidates with a cross-encoder before handing back
    a final scored, thresholded list.

    The BM25 index is rebuilt from the vectorstore's full corpus in memory —
    fine at book-corpus scale (thousands of chunks), and simplest to keep in
    sync with ingestion without a second persistent index to maintain.
    """

    def __init__(self, vectorstore, reranker_model: str):
        self.vectorstore = vectorstore
        self._reranker_model_name = reranker_model
        self._reranker = None
        self._bm25 = None
        self._corpus_docs: List[Document] = []
        self.refresh()

    def refresh(self) -> None:
        self._corpus_docs = _fetch_all_documents(self.vectorstore)
        tokenized = [_tokenize(d.page_content) for d in self._corpus_docs]
        self._bm25 = BM25Okapi(tokenized) if tokenized else None

    def _reranker_instance(self):
        if self._reranker is None:
            from sentence_transformers import CrossEncoder
            self._reranker = CrossEncoder(self._reranker_model_name)
        return self._reranker

    def _bm25_candidates(self, query: str, n: int) -> List[Document]:
        if not self._bm25 or not self._corpus_docs:
            return []
        scores = self._bm25.get_scores(_tokenize(query))
        ranked_idx = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:n]
        return [self._corpus_docs[i] for i in ranked_idx if scores[i] > 0]

    def _vector_candidates_with_scores(self, query: str, n: int) -> List[Tuple[Document, float]]:
        return self.vectorstore.similarity_search_with_relevance_scores(query, k=n)

    def retrieve(
        self,
        query: str,
        k: int = 6,
        fetch_k: int = 20,
        score_threshold: float = 0.25,
    ) -> List[Tuple[Document, float]]:
        vector_scored = self._vector_candidates_with_scores(query, fetch_k)
        vector_docs = [d for d, _ in vector_scored]
        bm25_docs = self._bm25_candidates(query, fetch_k)

        merged: dict = {}
        for d in vector_docs + bm25_docs:
            key = (d.metadata.get("source_file"), d.metadata.get("page"), d.page_content[:120])
            merged[key] = d
        candidates = list(merged.values())
        if not candidates:
            return []

        try:
            reranker = self._reranker_instance()
            pairs = [[query, d.page_content] for d in candidates]
            raw_scores = reranker.predict(pairs)
            scored = list(zip(candidates, (1.0 / (1.0 + math.exp(-float(s))) for s in raw_scores)))
        except Exception:
            # Cross-encoder unavailable (offline / model not cached yet) —
            # degrade to vector relevance instead of failing the request.
            vector_score_by_text = {d.page_content: s for d, s in vector_scored}
            scored = [(d, vector_score_by_text.get(d.page_content, 0.2)) for d in candidates]

        filtered = [pair for pair in scored if pair[1] >= score_threshold]
        if not filtered:
            filtered = sorted(scored, key=lambda p: p[1], reverse=True)[: min(3, len(scored))]
        filtered.sort(key=lambda p: p[1], reverse=True)
        return filtered[:k]
