# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Ramayana HelpBot: a RAG chatbot over the real Valmiki Ramayana plus ten more public-domain Hindu texts (the
Gita, several Puranas, the Upanishads, Ramcharitmanas — see `backend/data/` and README's "Index PDFs"
section). Flask backend does PDF ingestion → chunking → Chroma vector store → hybrid (BM25 + vector)
retrieval → cross-encoder rerank → OpenAI-generated grounded answers with citations, persisted per-user (or
per-guest — see below). React (Vite) frontend is a ChatGPT-style chat UI with its own login/signup screen.

Every message is routed by `classify_intent()` before retrieval — small talk gets a warm non-RAG reply,
off-topic questions get redirected, and only in-scope questions spend a retrieval pass. See `src/rag.py`.

Chat is **not** login-walled: anonymous visitors get a temporary guest session (a cookie, not an account) and
can ask up to `GUEST_MESSAGE_LIMIT` (5) questions before being asked to sign in; signing in reassigns that
guest session's messages to the new/existing account so the conversation carries over. See "Guest sessions"
below.

## Commands

### Backend (from `backend/`)
```bash
python -m venv .venv          # use Python 3.10–3.11 — some ML deps lack wheels for very new versions
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env          # then fill in OPENAI_API_KEY (and optionally OAuth client creds)

python app.py                  # runs Flask dev server on :8080 (debug mode from DevConfig)
python ingest.py               # CLI ingestion: loads PDFs from PDF_DIR (default ./data) into Chroma

python -m pytest                            # full backend test suite (offline, ~2s, all ML/network mocked)
python -m pytest --cov=src --cov=app        # with coverage
```

### Frontend (from `frontend/`)
```bash
npm install
npm run dev         # Vite dev server on :5173, proxies /api/* to localhost:8080 (changeOrigin: true)
npm run build
npm run preview

npm test            # vitest run (once)
npm run test:watch  # vitest watch mode
```

Both servers must be running for the app to work end-to-end (backend on 8080, frontend on 5173).

## Architecture

### Backend (`backend/`) — app factory + blueprints
- `app.py` — `create_app(config_object)` factory (not a module-level app). Wires Flask-SQLAlchemy, Flask-Login,
  and Authlib OAuth; registers Google/Facebook OAuth clients only if their client ID is set in config
  (`_register_oauth_providers`); creates DB tables; and — unless `SKIP_RAG_INIT` is set (true in `TestConfig`) —
  eagerly loads the embedding model, opens Chroma, and builds the hybrid retrieval index once via `_init_rag`,
  stashing them on `app.extensions["vectorstore"]` / `app.extensions["hybrid_index"]`. Registers `auth_bp` at
  `/api/auth` and `chat_bp` at `/api`. Run directly (`python app.py`) it builds a `DevConfig` app and serves it;
  tests instead call `create_app(TestConfig)` and never touch real ML models or the network.
- `src/config.py` — all env-driven settings (`BaseConfig`) plus `DevConfig` and `TestConfig` (in-memory SQLite,
  `SKIP_RAG_INIT=True`). Add new env-configurable behavior here, not as ad-hoc `os.getenv()` calls elsewhere.
- `src/extensions.py` — the shared `db` (SQLAlchemy), `login_manager` (Flask-Login), `oauth` (Authlib) singletons
  that blueprints import directly. `oauth._registry`/`oauth._clients` are process-global dicts — tests reset them
  in an autouse fixture (`tests/conftest.py`) so one test registering a provider can't leak into another.
- `src/models.py` — `User` (email/password_hash — null for OAuth-only accounts — /provider/avatar),
  `GuestSession` (temporary, unauthenticated conversation identity — see "Guest sessions" below), and `Message`
  (`sources_json` = citations, `meta_json` = retrieval metadata: model, contextualized search_query, chunk_count,
  top_relevance). `Message.user_id` and `Message.guest_session_id` are both nullable, with a DB-level
  `CheckConstraint` (`ck_message_single_owner`) enforcing that **exactly one** is set — this is enforced by
  SQLite itself, not just application code, so the invariant survives a bug in some future code path.
  `User.to_public_dict()` / `Message.to_public_dict()` are the only shapes the frontend ever sees.
- `src/auth.py` (`auth_bp`) — signup/login/logout/me as JSON endpoints (password hashing via
  `werkzeug.security`, already a Flask dependency); `/google` and `/google/callback`, `/facebook` and
  `/facebook/callback` via Authlib, each returning 503 with a message if that provider's client ID isn't
  configured rather than failing confusingly. OAuth find-or-create is by **email** (`_find_or_create_oauth_user`)
  — logging in with Google using the same email as an existing local/Facebook account links to that account.
  Instagram has **no backend route at all** — Meta retired the standalone consumer Instagram login in Dec 2024,
  so the frontend's Instagram button just shows an explanatory notice instead of hitting a route that would fail.
  All four login paths (signup, login, both OAuth callbacks) call `_claim_guest_session_for(user)` right after
  `login_user()` — see "Guest sessions" below.
- `src/chat.py` (`chat_bp`) — `/health`, `/chat/history`, `/chat` (POST), `/chat/clear`, `/ingest`
  (POST, `@login_required` — guests can't upload PDFs). `/chat` and `/chat/history` work for **both**
  authenticated users and anonymous guests (see below) — there's no `@login_required` on them; the actor is
  resolved inline (`current_user.is_authenticated` vs. the `guest_id` cookie). Reads `hybrid_index`/`vectorstore`
  off `current_app.extensions` rather than a module global (this is what makes the route testable with a fake
  index injected per-test). `/ingest` calls `hybrid_index.refresh()` after adding new chunks to Chroma so BM25
  search can find them immediately without an app restart. An `answer_question()` failure (bad/missing API key,
  provider outage) is caught and turned into a clean `502 {"error": "..."}` — the user's question is already
  persisted by that point regardless, only the assistant reply is skipped.

### Guest sessions (temporary, pre-login chat)
Anonymous visitors are **not** shown a login wall. `chat.py`'s `_get_or_create_guest_session()` mints a
`GuestSession` row and hands the browser an opaque UUID in a plain (non-auth) `guest_id` cookie
(`GUEST_COOKIE_NAME` / `GUEST_COOKIE_MAX_AGE` = 7 days) the first time they chat. Each `/api/chat` call from
that cookie increments `GuestSession.message_count`; once it reaches `GUEST_MESSAGE_LIMIT` (5, in
`src/models.py`), `/api/chat` returns `403 {"error": "guest_limit_reached", "guest": {...}}` instead of
processing the question (the question is **not** persisted in this case — the frontend rolls back its
optimistic UI add to match). Clearing chat (`/chat/clear`) does not reset the quota — `message_count` is only
ever touched by `/api/chat`.

Signing in (any of the four paths in `auth.py`) calls `_claim_guest_session_for(user)`, which reassigns every
`Message` row from `guest_session_id=<gs.id>` to `user_id=<user.id>` (one at a time, not a bulk UPDATE — see
the docstring for why), stamps `GuestSession.claimed_by_user_id`/`claimed_at` (kept as an audit row, not
deleted), and clears the `guest_id` cookie on the response so it can't be reused. The frontend does nothing
special here beyond re-fetching `/api/chat/history` after login — the claimed messages just appear.
- `src/retrieval.py` — `HybridIndex`: merges BM25 keyword search (`rank_bm25`, in-memory index rebuilt from the
  full Chroma corpus via `.get()`) with Chroma vector search, then **re-ranks the merged candidates with a
  cross-encoder** (`sentence-transformers.CrossEncoder`, model configurable via `RERANKER_MODEL`) before
  threshold-filtering down to `k`. Falls back to raw vector-relevance scores if the cross-encoder can't load
  (offline / model not cached) rather than failing the request, and falls back to the top-3 raw candidates if
  nothing clears `score_threshold` (better a weak answer than a hard "no context" on a borderline question).
  Tokenization (`_tokenize`) includes the Devanagari Unicode block so Sanskrit/Hindi terms aren't dropped by a
  latin-only word regex.
- `src/moderation.py` — `is_flagged()` calls OpenAI's moderation endpoint (`omni-moderation-latest`, a
  separate free classifier from the chat model) and is the very first check in `answer_question()`, ahead of
  intent classification — a hateful/abusive message short-circuits to `MODERATION_BLOCKED_RESPONSE` with
  `meta["intent"] = "blocked"` before any other LLM call runs. **Fails open** (treats the message as clean) on
  any API error, so a moderation-endpoint outage degrades to "no extra filter" rather than breaking chat
  entirely. Tests monkeypatch `src.rag.is_flagged` (see `conftest.py`'s autouse
  `_default_moderation_passthrough`) rather than hitting the real endpoint.
- `src/rag.py` — `answer_question()` first calls `classify_intent()` (one cheap LLM call, `INTENT_CLASSIFIER_PROMPT`)
  to route the message into `SMALLTALK` / `RAMAYANA` / `OFF_TOPIC` *before* any retrieval happens — this is what
  makes the bot handle "hi" naturally instead of forcing a grounded-context answer, and what makes it politely
  decline unrelated questions instead of attempting them. `OFF_TOPIC` returns the canned `OFF_TOPIC_RESPONSE`
  immediately (no further LLM call); `SMALLTALK` gets one more LLM call against `SMALLTALK_SYSTEM_PROMPT`, still
  no retrieval. Only `RAMAYANA` (the default on any unparseable classifier response — a classifier hiccup must
  never block a legitimate content question) proceeds to the existing pipeline: `contextualize_question()`
  rewrites a follow-up ("what about his brother?") into a standalone query using the last few chat turns
  (no-op, no LLM call, when there's no history), then `HybridIndex.retrieve()`, then `ChatOpenAI`
  (`OPENAI_MODEL`, temperature=0). Always returns the same 3-tuple `(answer, sources, meta)` regardless of
  branch — `meta["intent"]` records which one ran; `sources` is `[]` for the two non-`RAMAYANA` branches. Sources
  are deduped by (file, page) keeping the highest-relevance occurrence, sorted by relevance descending; `meta`
  is what `chat.py` persists into `Message.meta_json`.
- `src/prompts.py` — `SCOPE_PHRASE` is the single source of truth for what this assistant claims to cover,
  interpolated into `BASE_SYSTEM_PROMPT`, `INTENT_CLASSIFIER_PROMPT`, `SMALLTALK_SYSTEM_PROMPT`, and
  `OFF_TOPIC_RESPONSE` — **update it, not each string separately, whenever `backend/data/` gains a new text**.
  This isn't hypothetical: the scope string once said "Ramayana + connected Puranas" for a while after the
  Gita/Upanishads/Ramcharitmanas were ingested, which made the classifier route genuine in-corpus questions
  ("what does the Gita say about...") to `OFF_TOPIC` — a real bug, caught by live-testing after ingestion,
  not by the test suite (the tests mock the classifier, so they can't catch a scope-wording mismatch).
  `BASE_SYSTEM_PROMPT` (strict grounding, every claim traceable to a chunk internally but never printed as
  `[Chunk N]` in the visible answer, no fabricated citations) + `INTENT_CLASSIFIER_PROMPT` /
  `SMALLTALK_SYSTEM_PROMPT` / `OFF_TOPIC_RESPONSE` (topic routing, see `rag.py`) + `USER_PROMPT_TEMPLATE`
  (Answer / You-might-also-ask sections — no separate Sources section in the LLM's own output; the frontend's
  structured `sources` panel is the only citation UI). Plain string constants — edit directly to change
  tone/precision behavior.
- `src/vectorstore.py` — Chroma pinned to `hnsw:space: cosine` so relevance scores are bounded/comparable.
  Only affects newly-created collections — delete `backend/chroma_store/` and re-ingest to pick this up on an
  older store.
- `src/ingestion.py` — unchanged pattern: `PyPDFLoader` + `RecursiveCharacterTextSplitter` (chunk_size=800,
  overlap=200, `।` danda included as a separator for Indic text), shared between `ingest.py` (CLI) and
  `POST /api/ingest` via `ingest_pdfs_into_vectorstore()`.

### Backend tests (`backend/tests/`)
- `conftest.py` — `app`/`client` fixtures build a fresh `TestConfig` app per test (in-memory SQLite, dropped
  after); `FakeLLM` and `FakeHybridIndex` stand in for `ChatOpenAI`/`HybridIndex` so no test touches OpenAI,
  HuggingFace, or a cross-encoder download. `fake_hybrid_index` fixture also sets a non-`None` sentinel
  `vectorstore` so the `/api/ingest` "is RAG configured" check passes without a real Chroma instance.
  `_reset_oauth_registry` (autouse) clears the process-global Authlib registry between tests.
- Coverage is ~86%; the uncovered lines are real OAuth callback network calls and the real `_init_rag` model
  loading — intentionally not unit-tested, since faking them wouldn't test anything real and hitting the real
  network/models in a "unit" suite isn't worth the flakiness.

### Frontend (`frontend/`)
- `src/api.js` — the only place that talks to the backend (`axios` instance, `withCredentials: true` so the
  Flask session cookie flows). Every component calls through `api.*`, never raw `axios`.
- `src/App.jsx` — top-level component. `user` state is `undefined` (loading) → shows `.loadingSplash`; once
  resolved, `null` (anonymous/guest) and a user object both render the **same** main chat shell — there is no
  forced login wall (see "Guest sessions" in the backend section). `authGate` state (`null | "forced" |
  "voluntary"`) is what actually swaps in `<AuthScreen>`: `"forced"` when the backend 403s with
  `guest_limit_reached`, `"voluntary"` when a guest clicks "Log in / Sign up" themselves (and can cancel back
  via `onCancel`). `guestInfo` (`{remaining, limit}`, from `/api/chat/history`'s and `/api/chat`'s `guest` field)
  drives the counter pills in the sidebar and topbar. On `send()`, a `403 guest_limit_reached` response pops the
  just-added optimistic user message back off (the backend never persisted it either) before opening the gate.
  Chat is **not** stored in `localStorage` — it's server-side, fetched via `/api/chat/history` whenever `user`
  changes (including from `null`, so guests get their existing guest-session history too).
  `localStorage` is only used for two device-level UI prefs: `ramayana_helpbot_theme` and `ramayana_helpbot_veil`.
  `PROMPT_CARDS` defines the landing screen's 4 suggestion chips (a teaser — `promptsOpen` opens the full
  `<PromptLibrary>`). `shlokasOpen`/`promptsOpen` state render `<ShlokaLibrary>`/`<PromptLibrary>` as full
  overlays; both `onAsk` props are just `send(text)` — asking from a card is identical to typing a question,
  it just pre-fills and submits it, so it goes through the same guest-quota/intent-routing/history path as
  anything else. `SOURCE_DISPLAY_NAMES` maps known indexed PDF filenames to a readable citation title (e.g.
  `valmiki_ramayana_griffith.pdf` → "Valmiki Ramayana (Griffith)") — add an entry here whenever a new text is
  ingested, or the citation panel falls back to a de-slugged raw filename.
- `src/shlokas.js` — static, hand-curated data (not fetched from the backend or RAG'd): `PERSONAS` (id/label/blurb,
  5 of them: Seva & Devotion, Modern Professional, Family & Parenting, Student & Learner, Facing Hardship) and
  `SHLOKAS` (each tagged with a `persona`, plus `devanagari`/`transliteration`/`translation`/`source`/
  `explanation`). Every verse cites its exact Kanda/Sarga/verse (Valmiki) or is explicitly labeled as a
  Tulsidas/Hanuman Chalisa verse — **never misattribute a non-Valmiki verse to Valmiki** if extending this list;
  verify any addition against a primary source the way the existing entries were (sanskritdocuments.org,
  hanuman-chalisa.com) rather than generating verses from memory.
- `src/ShlokaLibrary.jsx` — persona-tabbed modal reading from `shlokas.js`. `src/promptData.js` /
  `src/PromptLibrary.jsx` — the same pattern, category-tabbed, for a fuller prompt library beyond the landing
  chips. Both are purely presentational plus one `onAsk` callback — no network calls of their own. **Naming
  note:** the data files are `shlokas.js` / `promptData.js`, not `Shlokas.js` / `PromptLibrary.js` — macOS's
  case-insensitive filesystem will silently resolve an import to the wrong file if a data module and a
  same-named component only differ by case (this actually happened once — `promptLibrary.js` collided with
  `PromptLibrary.jsx` and broke the build with a confusing "no default export" error).
- `src/Logo.jsx` — the app's mark: a three-shikhara temple skyline referencing Ayodhya's Ram Mandir (tall
  central spire + two shorter flanking ones, each a stepped "amalaka" tier stack, dhwaja flag finial atop the
  center), not the Om glyph and not the originally-tried bow-and-arrow (Kodanda) — the bow read as a generic
  "back/undo" icon at sidebar sizes, a genuine usability problem for a mark reused everywhere. Filled SVG via
  `currentColor`, `size` prop in px. Used in the sidebar brand row, mobile topbar, landing emblem, auth screen,
  chat message avatars, and loading splash — if adding another brand spot, use `<Logo>` there too rather than
  reintroducing a raw glyph. `frontend/public/favicon.svg` is a fixed-color (non-`currentColor`) copy of the
  same silhouette on a dark plinth backdrop, wired via `<link rel="icon">` in `index.html` — keep the two in
  sync if the mark's paths change.
- `src/AuthScreen.jsx` — login/signup form (client-side validation mirrors the backend's: email regex, 8-char
  password minimum) plus Google/Facebook OAuth buttons (plain `<a href="/api/auth/google">` — a full navigation,
  not an XHR, since OAuth requires a real browser redirect) and an Instagram button that shows an explanatory
  notice on click rather than hitting a route that doesn't exist. Accepts `gateReason` (defaults the tab to
  "signup" and shows `.gateBanner` when `"forced"`) and `onCancel` (renders a "Continue as guest" link).
- Styling is a single global stylesheet (`src/styles.css`), a CSS-custom-property design-token system: light
  values on `:root`, dark overrides under both `@media (prefers-color-scheme: dark)` (system default) and
  `:root[data-theme="dark"]` (explicit toggle) — any new color must be added as a token in both places. Two
  accent roles are used consistently — `--accent` (antique temple gold) and `--accent-2` (calming sacred blue,
  echoing Rama's traditional complexion) — don't add a third. `--font-serif` (system serif stack, no network
  font) is reserved for ceremonial moments only — landing/auth titles and the devotional epigraph — body and UI
  chrome stay in `--font` (sans) for legibility.
- `frontend/public/ramayana-bg.jpg` is currently a 19th-century Kalighat "Rama and Sita enthroned with
  Lakshmana and Hanuman attending" painting (Cleveland Museum of Art, Open Access / CC0 — source:
  `commons.wikimedia.org`, accession 2003.134.a), chosen specifically to depict all four figures together.
  It's git-tracked (not gitignored) — if replacing it again, keep it tracked so it can't silently revert to
  a stale local copy, and confirm any replacement's license is public-domain/CC0 before committing.
- Background art is two separate layers: `.bgArt` (the image, always full strength) and `.bgVeil` (a gradient
  overlay whose `opacity` inline style is driven by the sidebar's background-intensity slider, `veilOpacity`
  state in `App.jsx`) — this is what makes the veil strength independently adjustable rather than baked into
  a single flattened background. `--veil-1/2/3` tokens are fully-opaque solid colors for exactly this reason;
  don't reintroduce alpha into them or the slider's range stops being meaningful.
- Sidebar collapses to an off-canvas drawer (`.sidebar.open` + `.sidebarBackdrop`) below 980px.
- `src/ContactPanel.jsx` — static info modal (email, repo link, scope disclaimer), same `.shlokaOverlay`/
  `.shlokaPanel` chrome as the other modals. No backend involved.
- `src/sacredGeography.js` / `src/SacredMap.jsx` — "Sacred Geography": a simple, hand-drawn (not
  geographically projected) subcontinent-plus-Sri-Lanka silhouette (`<Landmass>` in `SacredMap.jsx`) with 8
  Ramayana story-locations placed on it by hand-picked `x`/`y` percentages, connected in narrative order
  (`MAIN_ROUTE_IDS` — Ayodhya → Prayag → Chitrakoot → Panchavati → Kishkindha → Rameswaram → Lanka; Janakpur
  is an unconnected spur) by a dashed SVG route line. Each segment shows a real **haversine straight-line km
  distance** between the two places' actual modern coordinates, labeled beside the line
  (`distanceFromPrevKm`), plus an illustrative foot-travel duration (`footDays` = km ÷ ~25 km/day) — both are
  clearly captioned as beeline/illustrative estimates, not a claim about the exact historical path. Clicking a
  marker opens a detail card: a representative photo (`image`/`imageCaption`, downloaded from Wikimedia
  Commons under CC/GODL licenses into `frontend/public/places/`, not hotlinked), a distance/duration stat row,
  a longer story summary, and a "local tradition & folklore" note — deliberately hedged as tradition/belief,
  not asserted historical fact, matching `prompts.py`'s "respectful, neutral tone; avoid sectarian claims"
  rule. Kishkindha (`special: "hanuman"` in the data) gets an extra pulsing marker ring and a floating
  "Hanuman ji" badge that animates in on hover/focus (`.mapMarker.special`/`.mapHanuman` in `styles.css`).
  **Route order matters**: Prayag (Bharadwaja's ashram) comes before Chitrakoot in the actual narrative — get
  this backwards and both the polyline and the per-segment distances silently become wrong. Purely
  presentational plus an `onAsk` callback into the normal chat pipeline, same pattern as
  `ShlokaLibrary`/`PromptLibrary`. When placing a new marker or moving an existing one, leave enough `x`/`y`
  gap from its neighbors — the place-name label sits directly under the pin and the distance pill sits beside
  the connecting line, and both will visually collide if two markers are too close together.
- `AnimatedMarkdown` (in `App.jsx`) fakes a word-by-word "generating" reveal for freshly-arrived assistant
  answers only (messages loaded from history render instantly, `animate=false`) by growing a visible-character
  count on a `setInterval` and re-rendering the growing substring through `ReactMarkdown` each tick. **Must
  stay idempotent** — schedule fresh and always clear on cleanup — rather than guard itself with a "did this
  already start" ref: this app renders through `<React.StrictMode>` (`main.jsx`), whose dev-mode
  mount→cleanup→mount replay will clear the first interval and then have a start-once guard block the second
  mount from ever scheduling a replacement, silently leaving every answer stuck at zero visible characters.
  This isn't hypothetical — it shipped once and was only caught by an end-to-end Playwright check that waited
  for real rendered text, not by the test suite (jsdom doesn't replay StrictMode's double-invoke the same way).

### Frontend tests (`frontend/src/*.test.jsx`)
- Vitest + jsdom + React Testing Library (`vite.config.js`'s `test` block; setup file `src/setupTests.js`).
  `./api` is mocked with `vi.mock` in every test file — no test hits a real network call.
- A submit `<button type="submit">` inside a form must be triggered with `fireEvent.submit(form)` in these
  tests, not `userEvent.click(button)` — the jsdom/user-event combo here doesn't reliably fire the form's
  native submit-on-click behavior; direct `fireEvent.submit` is what actually exercises the `onSubmit` handler.

## Key behaviors to preserve
- RAG components live on `app.extensions`, not module globals — routes must read them via `current_app.extensions`
  so tests can inject fakes per-app-instance.
- `/api/chat` and `/api/chat/history` intentionally allow BOTH authenticated users and anonymous guests — don't
  add `@login_required` back to them. `/api/ingest` stays `@login_required` (guests can't upload PDFs).
- The `Message.user_id` / `Message.guest_session_id` "exactly one set" invariant is enforced by a DB
  `CheckConstraint`, not just Python — any new code path that creates a `Message` must set exactly one, or the
  insert raises `IntegrityError` (by design; don't work around it by relaxing the constraint).
- `ingest_pdfs_into_vectorstore()` stays the single ingestion entrypoint shared by the CLI and the route; after
  it runs against the live app, `hybrid_index.refresh()` must also run or BM25 search won't see the new chunks.
- Two scale bugs already bit this corpus once (both fixed, both worth not reintroducing): `add_documents()`
  batches at `batch_size=2000` (default) rather than passing the whole chunk list — Chroma rejects a single
  call above its configured max (~5,461 seen locally); and `_fetch_all_documents()` in `retrieval.py` paginates
  Chroma's `.get()` with `limit`/`offset` rather than one unbounded call — SQLite errors with "too many SQL
  variables" past a few thousand rows. Both were silent at single-book (~4k chunk) scale and only surfaced
  once the corpus reached ~29k chunks across 11 books — if extending either code path, keep the paging/batching,
  don't "simplify" it back to a single call because it looks unnecessary against a small local test corpus.
- Only PDF uploads are accepted; scanned/non-text PDFs won't extract usable text since there's no OCR step.
  **When sourcing more archive.org texts**: many items expose a scanned "Image Container PDF" as the primary
  download with zero embedded text — always sample-extract a few pages after downloading (a handful of pages
  reading as empty strings is the tell) before trusting a new PDF is ingestible; if it's image-only, check
  that item's `/metadata/<identifier>` API response for an `_text.pdf` ("Additional Text PDF") sibling file
  and use that instead. This happened for 4 of the 10 non-Ramayana texts in this corpus.
- Don't hardcode `http://localhost:8080` for OAuth redirect URIs — they're built with `url_for(_external=True)`,
  which depends on the `changeOrigin: true` Vite proxy setting to resolve to the backend's real address.
- `backend/data/*.pdf` (11 public-domain texts — Griffith's Ramayana plus the Gita, several Puranas, the
  Upanishads, Ramcharitmanas; see README's "Index PDFs" table for sources) is the real corpus this app ships
  ingested against — gitignored, so a fresh clone needs to re-download and `python ingest.py` before chat has
  anything to retrieve. `frontend/src/App.jsx`'s `SOURCE_DISPLAY_NAMES` should get a new entry alongside any
  new file added here, or citations show a raw filename instead of a readable title.
