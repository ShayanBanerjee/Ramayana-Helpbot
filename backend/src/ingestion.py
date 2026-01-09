import os
from typing import List, Tuple
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def load_pdfs(pdf_paths: List[str]):
    docs = []
    for path in pdf_paths:
        loader = PyPDFLoader(path)
        loaded = loader.load()
        base = os.path.basename(path)
        for d in loaded:
            d.metadata["source_file"] = base
        docs.extend(loaded)
    return docs

def chunk_documents(docs, chunk_size: int = 900, chunk_overlap: int = 150):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", "।", ".", " ", ""],  # danda helpful for Indic text
    )
    return splitter.split_documents(docs)

def ingest_pdfs_into_vectorstore(pdf_paths: List[str], vectorstore) -> Tuple[int, int]:
    """Loads PDFs, chunks them, and upserts into the given vectorstore."""
    docs = load_pdfs(pdf_paths)
    chunks = chunk_documents(docs)
    vectorstore.add_documents(chunks)
    return len(docs), len(chunks)
