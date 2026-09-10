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

def chunk_documents(docs, chunk_size: int = 800, chunk_overlap: int = 200):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", "।", ".", " ", ""],  # danda helpful for Indic text
    )
    return splitter.split_documents(docs)

def ingest_pdfs_into_vectorstore(pdf_paths: List[str], vectorstore, batch_size: int = 2000) -> Tuple[int, int]:
    """Loads PDFs, chunks them, and upserts into the given vectorstore.

    Upserts in batches: Chroma rejects a single add_documents() call above
    its configured max batch size (a few thousand, e.g. 5461 seen locally) —
    a single-PDF ingest never approached that, but ingesting a multi-book
    corpus in one call does. 2000 stays safely under that regardless of the
    exact configured limit.
    """
    docs = load_pdfs(pdf_paths)
    chunks = chunk_documents(docs)
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        vectorstore.add_documents(batch)
        print(f"Indexed {min(i + batch_size, len(chunks))}/{len(chunks)} chunks...")
    return len(docs), len(chunks)
