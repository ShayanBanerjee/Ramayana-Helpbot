# Ramayana HelpBot (RAG) — Chroma DB + LangChain + Flask + React

Local-first RAG chatbot over your Valmiki Ramayana PDFs.
Ingest PDFs → build Chroma index → retrieve top-K chunks → generate grounded answers with citations.

## Tech stack
- **Backend:** Python + Flask
- **RAG:** LangChain
- **Vector DB:** **Chroma (local persistent)**
- **Embeddings:** SentenceTransformers (HuggingFace)
- **LLM:** OpenAI (same operational pattern as your existing legal chatbot)
- **Frontend:** React (Vite) + Markdown rendering

---

## 1) Prerequisites
- Python 3.10+
- Node 18+
- An OpenAI API key

---

## 2) Backend setup

```bash
cd backend

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `.env`:
```bash
cp .env.example .env
```

Update:
- `OPENAI_API_KEY`
- Optionally `OPENAI_MODEL`, `EMBEDDING_MODEL`

---

## 3) Index PDFs (two ways)

### Option A — Drop PDFs into `backend/data/` and run CLI ingestion
Put your Valmiki Ramayana PDFs in:
- `backend/data/`

Then:
```bash
cd backend
source .venv/bin/activate
python ingest.py
```

### Option B — Upload PDFs from the UI
Start the backend (Step 4), then use the left “Upload PDFs” panel in the UI.
It calls:
- `POST /api/ingest`

---

## 4) Start backend server
```bash
cd backend
source .venv/bin/activate
python app.py
```

Health check:
- http://localhost:8080/api/health

---

## 5) Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open:
- http://localhost:5173

The Vite dev server proxies `/api/*` to `http://localhost:8080`.

---

## 6) API reference

### POST `/api/ingest`
- Multipart form-data
- Key: `files` (one or many PDFs)

Response:
```json
{ "ok": true, "pages_loaded": 1200, "chunks_indexed": 3400 }
```

### POST `/api/chat`
Request:
```json
{ "question": "Who is Hanuman and what are his key deeds?" }
```

Response:
```json
{
  "answer": "....",
  "sources": [
    { "source_file": "valmiki_ramayana.pdf", "page": 123 }
  ]
}
```

---

## License
Use as you prefer for your learning and demonstration purposes.
