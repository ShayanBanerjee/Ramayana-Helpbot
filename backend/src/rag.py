from src.prompts import SYSTEM_PROMPT
from src.llama_cpp_client import call_llama_cpp

def build_context_from_docs(docs):
    if not docs:
        return "No relevant context was retrieved."

    parts = []
    for i, d in enumerate(docs, 1):
        meta = d.metadata or {}
        parts.append(
            f"[Chunk {i}] source_file={meta.get('source_file')} "
            f"page={meta.get('page')}\n{d.page_content}"
        )
    return "\n\n".join(parts)

def answer_question(question: str, retriever):
    docs = retriever.get_relevant_documents(question)
    context = build_context_from_docs(docs)

    prompt = SYSTEM_PROMPT.format(
        context=context,
        question=question
    )

    answer = call_llama_cpp(
        prompt=prompt,
        temperature=0.0,
        max_tokens=512
    )

    sources = []
    for d in docs:
        meta = d.metadata or {}
        sources.append({
            "source_file": meta.get("source_file"),
            "page": meta.get("page"),
        })

    return answer, sources
