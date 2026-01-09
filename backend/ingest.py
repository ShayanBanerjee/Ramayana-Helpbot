import os
import glob
from dotenv import load_dotenv

from src.helper import download_embeddings_model
from src.vectorstore import get_chroma_vectorstore
from src.ingestion import ingest_pdfs_into_vectorstore

load_dotenv()

def main():
    pdf_dir = os.getenv("PDF_DIR", "./data")
    pdf_paths = glob.glob(os.path.join(pdf_dir, "*.pdf"))
    if not pdf_paths:
        raise SystemExit(f"No PDFs found in {pdf_dir}. Add PDFs there or set PDF_DIR.")

    embedding = download_embeddings_model(os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))
    vectorstore = get_chroma_vectorstore(embedding)

    doc_count, chunk_count = ingest_pdfs_into_vectorstore(pdf_paths, vectorstore)

    print(f"✅ Loaded {doc_count} pages and indexed {chunk_count} chunks into Chroma.")
    print("You can now run the backend server: python app.py")

if __name__ == "__main__":
    main()
