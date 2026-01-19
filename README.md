# 🏹 Ramayana HelpBot – Offline RAG Chatbot (llama.cpp Edition)

A **Retrieval-Augmented Generation (RAG)** chatbot built on the *Valmiki Ramayana*, designed to work **fully offline**, **CPU-first**, and **open‑source**.  
This version uses **llama.cpp** for local inference and **ChromaDB** as the vector database.

> ✅ No OpenAI API  
> ✅ No internet required at runtime  
> ✅ Works on CPU (GPU optional later)  

---

## 1. What This Application Does

- Ingests **multiple Ramayana PDF files**
- Splits text into semantic chunks
- Creates embeddings and stores them in **ChromaDB**
- Answers user questions using **retrieved context only**
- Shows **source + page references** for transparency

This avoids hallucinations and ensures answers are grounded in scripture.

---

## 2. High-Level Architecture

```
User (Browser)
   ↓
React Frontend (Chat UI)
   ↓
Flask Backend (API Layer)
   ↓
ChromaDB (Vector Search)
   ↓
llama.cpp (Local LLM, CPU)
```

---

## 3. Technology Stack

### Frontend
- React (Vite)
- Markdown rendering
- Clean, Ramayana-themed UI

### Backend
- Flask + Flask-CORS
- LangChain (retrieval & ingestion utilities)
- ChromaDB (local vector store)
- llama.cpp (local LLM inference)

### Models
- **LLM**: Mistral‑7B‑Instruct (GGUF, quantized)
- **Embeddings**: SentenceTransformers

---

## 4. Project Structure

```
Ramayana-HelpBot/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env
│   ├── models/
│   ├── data/
│   └── src/
│       ├── rag.py
│       ├── helper.py
│       ├── prompts.py
│       └── llama_cpp_client.py
├── frontend/
│   ├── src/
│   └── styles.css
└── README.md
```

---

## 5. Setup Instructions (CPU, Offline)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Download Model

```bash
mkdir backend/models
wget https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf  -O backend/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf
```

### Environment Variables

```env
LLAMA_MODEL_PATH=./models/mistral-7b-instruct-v0.2.Q4_K_M.gguf
LLAMA_N_CTX=4096
LLAMA_N_THREADS=8
```

### Run Backend

```bash
python app.py
```

---

## 6. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 7. RAG Flow

1. PDFs ingested and embedded
2. Chunks stored in ChromaDB
3. Query retrieves top-K chunks
4. llama.cpp generates grounded answer
5. Sources returned

---

## 8. Performance Notes

- CPU-only inference is slow (2–6 minutes for long answers)
- GPU reduces latency drastically
- Designed for correctness first

---

## 9. Future Upgrades

- GPU acceleration
- vLLM backend
- Verse-level citations

---

## 10. Disclaimer

Educational and research use only.
