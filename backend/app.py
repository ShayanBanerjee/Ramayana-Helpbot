import os
import tempfile
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from src.helper import download_embeddings_model
from src.vectorstore import get_chroma_vectorstore
from src.ingestion import ingest_pdfs_into_vectorstore
from src.rag import answer_question

load_dotenv()

app = Flask(__name__)
CORS(app)

# Global init (same operational pattern as your existing app)
embedding = download_embeddings_model(os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))
vectorstore = get_chroma_vectorstore(embedding)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "vector_db": "chroma",
        "collection": os.getenv("CHROMA_COLLECTION", "ramayana_kb")
    })

@app.post("/api/chat")
def chat():
    payload = request.get_json(force=True)
    question = (payload.get("question") or "").strip()
    if not question:
        return jsonify({"error": "Missing 'question'"}), 400

    answer, sources = answer_question(question, retriever)
    return jsonify({"answer": answer, "sources": sources})

@app.post("/api/ingest")
def ingest():
    """Upload one or more PDFs and index them into Chroma."""
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files uploaded. Use form-data key 'files'."}), 400

    pdf_paths = []
    with tempfile.TemporaryDirectory() as td:
        for f in files:
            name = f.filename or ""
            if not name.lower().endswith(".pdf"):
                return jsonify({"error": f"Only PDF supported. Got: {name}"}), 400
            path = os.path.join(td, name)
            f.save(path)
            pdf_paths.append(path)

        doc_count, chunk_count = ingest_pdfs_into_vectorstore(pdf_paths, vectorstore)

    return jsonify({"ok": True, "pages_loaded": doc_count, "chunks_indexed": chunk_count})

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    app.run(host="0.0.0.0", port=port, debug=True)
