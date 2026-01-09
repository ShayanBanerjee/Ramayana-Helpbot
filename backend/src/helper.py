from langchain_community.embeddings import HuggingFaceEmbeddings

def download_embeddings_model(model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
    """Central embeddings loader (mirrors your existing helper pattern)."""
    return HuggingFaceEmbeddings(model_name=model_name)
