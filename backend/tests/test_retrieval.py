import math

import pytest
from langchain_core.documents import Document

from src.retrieval import HybridIndex, _tokenize


class FakeVectorstore:
    def __init__(self, documents, scores=None):
        self._documents = documents
        self._scores = scores or [max(0.05, 0.9 - 0.1 * i) for i in range(len(documents))]

    def get(self, include=None, limit=None, offset=0):
        page = self._documents[offset : offset + limit] if limit is not None else self._documents[offset:]
        return {
            "documents": [d.page_content for d in page],
            "metadatas": [d.metadata for d in page],
        }

    def similarity_search_with_relevance_scores(self, query, k=20):
        return list(zip(self._documents, self._scores))[:k]


class FakeReranker:
    def __init__(self, score_by_text):
        self.score_by_text = score_by_text
        self.predict_calls = 0

    def predict(self, pairs):
        self.predict_calls += 1
        # Return raw (pre-sigmoid) scores; large positive/negative so the
        # sigmoid lands close to 1.0 / 0.0 and ordering is unambiguous.
        return [self.score_by_text.get(text, -10.0) for _query, text in pairs]


def _doc(text, source_file="ramayana.pdf", page=0):
    return Document(page_content=text, metadata={"source_file": source_file, "page": page})


def test_tokenize_handles_latin_and_devanagari():
    tokens = _tokenize("Hanuman met Rāma near लंका, the golden city.")
    assert "hanuman" in tokens
    assert "लंका" in tokens


def test_refresh_builds_bm25_from_vectorstore_corpus():
    docs = [_doc("Hanuman leaps across the ocean to Lanka."), _doc("Rama and Sita live in the forest.")]
    vs = FakeVectorstore(docs)
    index = HybridIndex(vs, reranker_model="unused")
    assert index._bm25 is not None
    assert len(index._corpus_docs) == 2


def test_refresh_paginates_large_corpora():
    # Regression test: refresh() once fetched the whole corpus in a single
    # unbounded .get() call, which Chroma's SQLite backend rejects past a
    # few thousand rows ("too many SQL variables") — hit in practice at
    # ~29,000 chunks across an 11-book corpus.
    docs = [_doc(f"Chunk number {i} about the Ramayana.", page=i) for i in range(2500)]
    vs = FakeVectorstore(docs)
    index = HybridIndex(vs, reranker_model="unused")
    assert len(index._corpus_docs) == 2500


def test_refresh_handles_empty_corpus():
    vs = FakeVectorstore([])
    index = HybridIndex(vs, reranker_model="unused")
    assert index._bm25 is None
    assert index.retrieve("anything") == []


def test_retrieve_merges_vector_and_bm25_and_filters_by_threshold(monkeypatch):
    docs = [
        _doc("Hanuman is the devoted son of the wind god Vayu.", page=0),
        _doc("The Balakanda describes Rama's childhood.", page=1),
        _doc("Ravana rules the island kingdom of Lanka.", page=2),
    ]
    vs = FakeVectorstore(docs, scores=[0.9, 0.5, 0.1])
    index = HybridIndex(vs, reranker_model="unused")

    reranker = FakeReranker({
        docs[0].page_content: 6.0,   # -> sigmoid close to 1.0
        docs[1].page_content: -6.0,  # -> sigmoid close to 0.0, filtered out
        docs[2].page_content: 4.0,   # -> sigmoid ~ 0.98
    })
    monkeypatch.setattr(index, "_reranker_instance", lambda: reranker)

    results = index.retrieve("Who is Hanuman?", k=6, fetch_k=6, score_threshold=0.5)
    texts = [d.page_content for d, _score in results]

    assert docs[0].page_content in texts
    assert docs[2].page_content in texts
    assert docs[1].page_content not in texts  # below threshold, correctly excluded
    assert reranker.predict_calls == 1
    # sorted descending by score
    assert results[0][1] >= results[-1][1]


def test_retrieve_falls_back_to_top_candidates_when_none_clear_threshold(monkeypatch):
    docs = [_doc("Weakly related chunk one."), _doc("Weakly related chunk two.")]
    vs = FakeVectorstore(docs, scores=[0.2, 0.15])
    index = HybridIndex(vs, reranker_model="unused")

    reranker = FakeReranker({d.page_content: -8.0 for d in docs})  # everything scores near 0
    monkeypatch.setattr(index, "_reranker_instance", lambda: reranker)

    results = index.retrieve("obscure query", k=6, fetch_k=6, score_threshold=0.9)
    assert len(results) == 2  # nothing cleared 0.9, so it fell back instead of returning empty


def test_retrieve_degrades_gracefully_when_reranker_unavailable(monkeypatch):
    docs = [_doc("Hanuman crosses the ocean.")]
    vs = FakeVectorstore(docs, scores=[0.77])
    index = HybridIndex(vs, reranker_model="unused")

    def _boom():
        raise RuntimeError("model download failed (offline)")

    monkeypatch.setattr(index, "_reranker_instance", _boom)

    results = index.retrieve("Who is Hanuman?", k=6, fetch_k=6, score_threshold=0.25)
    assert len(results) == 1
    assert results[0][1] == pytest.approx(0.77)  # fell back to the vector relevance score


def test_retrieve_deduplicates_candidates_seen_by_both_retrievers(monkeypatch):
    shared = _doc("Hanuman is devoted to Rama.", page=0)
    vs = FakeVectorstore([shared], scores=[0.8])
    index = HybridIndex(vs, reranker_model="unused")

    reranker = FakeReranker({shared.page_content: 5.0})
    monkeypatch.setattr(index, "_reranker_instance", lambda: reranker)

    results = index.retrieve("Hanuman devotion", k=6, fetch_k=6, score_threshold=0.1)
    assert len(results) == 1  # same chunk surfaced by both BM25 and vector search, not duplicated
