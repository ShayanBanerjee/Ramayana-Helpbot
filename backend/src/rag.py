import os
from typing import List, Dict, Any, Tuple
from langchain_openai import ChatOpenAI
from src.prompts import BASE_SYSTEM_PROMPT, USER_PROMPT_TEMPLATE

def _build_context(docs) -> str:
    if not docs:
        return "No relevant context was retrieved from the indexed PDFs."
    parts = []
    for i, d in enumerate(docs, 1):
        meta = d.metadata or {}
        parts.append(
            f"[Chunk {i}] source_file={meta.get('source_file')} page={meta.get('page')}\n{d.page_content}"
        )
    return "\n\n".join(parts)

def _sources_from_docs(docs) -> List[Dict[str, Any]]:
    sources = []
    for d in docs:
        meta = d.metadata or {}
        sources.append({
            "source_file": meta.get("source_file"),
            "page": meta.get("page"),
        })
    # de-duplicate
    unique = []
    seen = set()
    for s in sources:
        key = (s.get("source_file"), s.get("page"))
        if key not in seen:
            seen.add(key)
            unique.append(s)
    return unique

def answer_question(question: str, retriever, k: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
    docs = retriever.get_relevant_documents(question)
    context = _build_context(docs)

    llm = ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0,
        api_key=os.getenv("OPENAI_API_KEY", ""),
    )

    prompt = BASE_SYSTEM_PROMPT + "\n\n" + USER_PROMPT_TEMPLATE.format(context=context, question=question)
    resp = llm.invoke(prompt)

    return resp.content, _sources_from_docs(docs)
