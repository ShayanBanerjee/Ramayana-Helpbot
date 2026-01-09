import os
from dotenv import load_dotenv
from langchain_chroma import Chroma

load_dotenv()

def get_chroma_vectorstore(embedding):
    """Local Chroma vector store (persistent)."""
    persist_dir = os.getenv("CHROMA_DIR", "./chroma_store")
    collection = os.getenv("CHROMA_COLLECTION", "ramayana_kb")

    return Chroma(
        collection_name=collection,
        embedding_function=embedding,
        persist_directory=persist_dir,
    )
