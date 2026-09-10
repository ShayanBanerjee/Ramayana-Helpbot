import os
from typing import Any, Dict, List, Tuple

from langchain_openai import ChatOpenAI

from src.moderation import is_flagged
from src.prompts import (
    BASE_SYSTEM_PROMPT,
    CONTEXTUALIZE_PROMPT,
    INTENT_CLASSIFIER_PROMPT,
    MODERATION_BLOCKED_RESPONSE,
    OFF_TOPIC_RESPONSE,
    SMALLTALK_SYSTEM_PROMPT,
    USER_PROMPT_TEMPLATE,
)


def _display_page(meta: dict):
    # PyPDFLoader's "page" metadata is 0-indexed; show the human page number.
    page = meta.get("page")
    return page + 1 if isinstance(page, int) else page


def _build_context(scored_docs) -> str:
    if not scored_docs:
        return "No relevant context was retrieved from the indexed PDFs."
    parts = []
    for i, (d, score) in enumerate(scored_docs, 1):
        meta = d.metadata or {}
        parts.append(
            f"[Chunk {i}] source_file={meta.get('source_file')} page={_display_page(meta)} "
            f"relevance={score:.2f}\n{d.page_content.strip()}"
        )
    return "\n\n".join(parts)


def _sources_from_scored_docs(scored_docs) -> List[Dict[str, Any]]:
    sources = []
    for d, score in scored_docs:
        meta = d.metadata or {}
        sources.append({
            "source_file": meta.get("source_file"),
            "page": _display_page(meta),
            "relevance": round(float(score), 3),
        })
    # de-duplicate, keep the highest-relevance occurrence of each (file, page)
    best_by_key = {}
    for s in sources:
        key = (s.get("source_file"), s.get("page"))
        if key not in best_by_key or s["relevance"] > best_by_key[key]["relevance"]:
            best_by_key[key] = s
    return sorted(best_by_key.values(), key=lambda s: s["relevance"], reverse=True)


def _make_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0,
        api_key=os.getenv("OPENAI_API_KEY", ""),
    )


def classify_intent(question: str, llm=None) -> str:
    """Routes a message to one of SMALLTALK / RAMAYANA / OFF_TOPIC before any
    retrieval happens. Defaults to RAMAYANA on any unparseable/unexpected
    response — a classifier failure should never block a legitimate content
    question, only skip the (optional) small-talk/redirect shortcuts.
    """
    llm = llm or _make_llm()
    resp = llm.invoke(INTENT_CLASSIFIER_PROMPT.format(question=question))
    label = (resp.content or "").strip().upper()
    if "SMALLTALK" in label:
        return "SMALLTALK"
    if "OFF_TOPIC" in label or "OFF TOPIC" in label:
        return "OFF_TOPIC"
    return "RAMAYANA"


def contextualize_question(question: str, history: List[Dict[str, str]], llm=None) -> str:
    """Rewrites a follow-up question ("what about his brother?") into a
    standalone query using recent chat turns, so retrieval doesn't miss the
    referent. No-ops (returns the question unchanged) when there's no history
    to disambiguate against, which also keeps single-turn requests fast and
    keeps this out of the hot path for the common case.
    """
    if not history:
        return question

    llm = llm or _make_llm()
    turns = "\n".join(f"{h['role']}: {h['content']}" for h in history[-6:])
    prompt = CONTEXTUALIZE_PROMPT.format(history=turns, question=question)
    resp = llm.invoke(prompt)
    rewritten = (resp.content or "").strip()
    return rewritten or question


def answer_question(
    question: str,
    hybrid_index,
    k: int = 6,
    fetch_k: int = 20,
    score_threshold: float = 0.25,
    history: List[Dict[str, str]] = None,
) -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
    if is_flagged(question):
        return MODERATION_BLOCKED_RESPONSE, [], {"intent": "blocked"}

    llm = _make_llm()

    intent = classify_intent(question, llm=llm)

    if intent == "OFF_TOPIC":
        return OFF_TOPIC_RESPONSE, [], {"intent": "off_topic"}

    if intent == "SMALLTALK":
        resp = llm.invoke(SMALLTALK_SYSTEM_PROMPT.format(question=question))
        return resp.content, [], {"intent": "smalltalk"}

    search_query = contextualize_question(question, history or [], llm=llm)
    scored_docs = hybrid_index.retrieve(
        search_query, k=k, fetch_k=fetch_k, score_threshold=score_threshold
    )
    print(
        f"Retrieved {len(scored_docs)} relevant chunks (threshold={score_threshold}) "
        f"for question: {question!r} (searched as: {search_query!r})"
    )
    context = _build_context(scored_docs)

    prompt = BASE_SYSTEM_PROMPT + "\n\n" + USER_PROMPT_TEMPLATE.format(context=context, question=question)
    resp = llm.invoke(prompt)

    sources = _sources_from_scored_docs(scored_docs)
    meta = {
        "intent": "ramayana",
        "model": getattr(llm, "model_name", None) or os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "search_query": search_query,
        "chunk_count": len(scored_docs),
        "top_relevance": round(max((s for _, s in scored_docs), default=0.0), 3),
    }
    return resp.content, sources, meta
