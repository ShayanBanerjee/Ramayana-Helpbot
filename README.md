# Grantha — askgrantha.com (RAG) — Chroma DB + LangChain + Flask + React

Local-first RAG chatbot over the real Valmiki Ramayana and ten more public-domain Hindu texts (the Gita,
several Puranas, the Upanishads, Ramcharitmanas), with a 5-question guest trial, accounts, per-user chat
history, and a curated Sanskrit shloka library. Ingest PDFs → hybrid (BM25 + vector) retrieval →
cross-encoder rerank → generate grounded, cited answers — small talk and off-topic questions are routed
away from retrieval entirely, so it's pleasant to greet and honest about what it won't answer.

## Tech stack
- **Backend:** Python + Flask (app-factory + blueprints)
- **Accounts:** Flask-Login sessions, email/password + Google/Facebook OAuth (Authlib), SQLite via SQLAlchemy
- **RAG:** LangChain, hybrid retrieval (BM25 keyword search + Chroma vector search), cross-encoder reranking, conversation-aware follow-up rewriting
- **Vector DB:** **Chroma (local persistent)**
- **Embeddings:** SentenceTransformers (HuggingFace)
- **LLM:** OpenAI
- **Frontend:** React (Vite) + Markdown rendering
- **Testing:** pytest (backend), Vitest + React Testing Library (frontend)

---

## 1) Prerequisites
- Python 3.10–3.11 (some ML deps don't yet ship wheels for very new Python releases — 3.11 is the safest bet; on a fresh Ubuntu 26.04 VPS install it with `uv python install 3.11` — see DEPLOYMENT.md)
- Node 18+
- An OpenAI API key
- Optional: a Google Cloud OAuth client and/or a Meta for Developers app, for social login

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

At minimum, set `OPENAI_API_KEY`. Everything else has a working local default. See `.env.example` for
the full list (embeddings/reranker model, retrieval tuning, accounts/session config, OAuth).

### Accounts & sessions
Chatting doesn't require an account — anonymous visitors get a temporary guest session (a cookie) and can
ask up to **5 free questions**; signing in (email/password or Google/Facebook) at any point carries that
conversation over to the new account. A local SQLite database (`backend/instance/ramayana_helpbot.db` by
default — Flask's standard instance-folder convention) stores users, guest sessions, and chat history,
following normal relational rules (foreign keys, a `CHECK` constraint guaranteeing every message belongs to
exactly one owner — a user or a guest session, never both/neither).

- Set `SECRET_KEY` to something real once this leaves your laptop:
  `python -c "import secrets; print(secrets.token_hex(32))"`
- **Google login:** create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  (Web application), add `http://localhost:8080/api/auth/google/callback` as an authorized redirect URI,
  and set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- **Facebook login:** create an app at [developers.facebook.com](https://developers.facebook.com/) with the
  Facebook Login product, add `http://localhost:8080/api/auth/facebook/callback` as a valid OAuth redirect URI,
  and set `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`.
- **Instagram login:** not offered as a standalone consumer OAuth flow anymore — Meta retired the Instagram
  Basic Display API in Dec 2024. The UI's Instagram button explains this and points to Google/Facebook instead.
- Without OAuth credentials configured, those buttons return a clear "not configured" error — email/password
  signup always works.

---

## 3) Index PDFs (two ways)

This repo ships pre-configured to ingest **the real Valmiki Ramayana**, plus ten more public-domain Hindu
texts connected to it — all verified public-domain translations sourced from archive.org. None are committed
to git (like the rest of `backend/data/`), so a fresh clone needs to fetch and ingest them once:

| Text | Translator | Source |
|---|---|---|
| Valmiki Ramayana | Griffith (1870s–89) | [thermyanofvlmkit24869gut](https://archive.org/details/thermyanofvlmkit24869gut) |
| Bhagavad Gita | Telang (1898) | [in.ernet.dli.2015.45144](https://archive.org/details/in.ernet.dli.2015.45144) |
| Vishnu Purana | Wilson (1840/1895) | [in.ernet.dli.2015.47536](https://archive.org/details/in.ernet.dli.2015.47536) |
| Vishnu Purana (alt.) | Dutt (1896) | [vishnu-puran-ed-1](https://archive.org/details/vishnu-puran-ed-1) |
| Srimad Bhagavatam | Dutt (1896) | [in.ernet.dli.2015.272582](https://archive.org/details/in.ernet.dli.2015.272582) |
| Devi Bhagavata Purana | Vijnanananda (1921–23) | [SrimadDeviBhagavatamEnglish](https://archive.org/details/SrimadDeviBhagavatamEnglish) |
| Markandeya Purana | Dutt (1896) | [markandeyapurana021288mbp](https://archive.org/details/markandeyapurana021288mbp) |
| Agni Purana | Dutt (1903) | [in.ernet.dli.2015.279469](https://archive.org/details/in.ernet.dli.2015.279469) |
| Garuda Purana | Dutt (1908) | [garudapuranam00duttgoog](https://archive.org/details/garudapuranam00duttgoog) |
| Ramcharitmanas (Tulsidas) | Growse (1883) | [rmyanatulsids00growgoog](https://archive.org/details/rmyanatulsids00growgoog) |
| The Upanishads, Vol. 1 | Müller (1900, SBE) | [wg901](https://archive.org/details/wg901) |

Several of these archive.org items only expose a scanned "image container" PDF by default — pypdf can't
extract text from those. Where that's the case, use the `_text.pdf` (OCR'd, text-searchable) variant listed
on the same item's file list instead; a script would need to check each item's `/metadata/<id>` API response
for the exact filename (see `CLAUDE.md`'s note on this if scripting it, since exact filenames vary per item).

### Option A — Drop PDFs into `backend/data/` and run CLI ingestion
```bash
cd backend
source .venv/bin/activate
python ingest.py
```

### Option B — Upload PDFs from the UI
Log in, then use the "Upload PDFs" item in the sidebar (or the paperclip icon in the message box).
Calls `POST /api/ingest` (requires login).

---

## 4) Start backend server
```bash
cd backend
source .venv/bin/activate
python app.py
```

Health check: http://localhost:8080/api/health

---

## 5) Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

The Vite dev server proxies `/api/*` to `http://localhost:8080` (with `changeOrigin` so Flask's OAuth
redirect URLs resolve to the backend's own address regardless of which origin the browser is on).

---

## 6) Testing

### Backend
```bash
cd backend
source .venv/bin/activate
python -m pytest                                   # full suite
python -m pytest --cov=src --cov=app                # with coverage
```
All LLM calls, embedding/reranker models, and OAuth network calls are mocked/stubbed — the suite runs
fully offline in a couple of seconds.

### Frontend
```bash
cd frontend
npm test          # run once
npm run test:watch
```

---

## 7) API reference

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/signup` | `{ name, email, password }` |
| POST | `/api/auth/login` | `{ email, password }` |
| POST | `/api/auth/logout` | requires session |
| GET | `/api/auth/me` | `{ user: null }` if anonymous |
| GET | `/api/auth/google` | redirects to Google consent |
| GET | `/api/auth/facebook` | redirects to Facebook consent |

### Chat
| Method | Path | Notes |
|---|---|---|
| GET | `/api/chat/history` | authenticated user's or guest's persisted conversation, plus `guest: {remaining, limit}` |
| POST | `/api/chat` | `{ question }` → `{ answer, sources, guest }`; `403 guest_limit_reached` past 5 guest questions |
| POST | `/api/chat/clear` | wipes this user's/guest's visible history (doesn't reset the guest quota) |
| POST | `/api/ingest` | **requires login.** multipart, field `files` (one or many PDFs) |

`sources` entries look like `{ source_file, page, relevance }`, where `relevance` is the cross-encoder's
0–1 confidence score for that chunk (surfaced in the UI as a "% match" badge). `/api/chat` and
`/api/chat/history` work for anonymous guests too — see "Accounts & sessions" above.

---

## License
Use as you prefer for your learning and demonstration purposes.
