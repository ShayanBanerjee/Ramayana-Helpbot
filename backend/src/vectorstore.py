import os
from dotenv import load_dotenv
from langchain_chroma import Chroma

load_dotenv()

def get_chroma_vectorstore(embedding):
    """Local Chroma vector store (persistent).

    Collection is explicitly pinned to cosine distance: it's what makes
    `similarity_search_with_relevance_scores` return a well-behaved 0-1
    score, which the RAG layer relies on to filter out low-relevance chunks.
    (Chroma's default "l2" space doesn't produce a comparable bounded score.)
    Only affects newly-created collections — if you have an existing
    chroma_store/ predating this, delete it and re-ingest to pick it up.
    """
    persist_dir = os.getenv("CHROMA_DIR", "./chroma_store")
    collection = os.getenv("CHROMA_COLLECTION", "ramayana_kb")

    return Chroma(
        collection_name=collection,
        embedding_function=embedding,
        persist_directory=persist_dir,
        collection_metadata={"hnsw:space": "cosine"},
    )
