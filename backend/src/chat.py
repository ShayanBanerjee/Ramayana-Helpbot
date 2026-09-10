import json
import os
import tempfile
import uuid

from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required

from src.extensions import db
from src.ingestion import ingest_pdfs_into_vectorstore
from src.models import GUEST_COOKIE_NAME, GUEST_MESSAGE_LIMIT, GuestSession, Message
from src.rag import answer_question

chat_bp = Blueprint("chat", __name__)

GUEST_COOKIE_MAX_AGE = 7 * 24 * 3600  # 7 days — long enough to survive a closed tab, short enough to not linger


def _set_guest_cookie(response, guest_session_id: str):
    response.set_cookie(
        GUEST_COOKIE_NAME,
        guest_session_id,
        max_age=GUEST_COOKIE_MAX_AGE,
        httponly=True,
        samesite="Lax",
        secure=current_app.config.get("SESSION_COOKIE_SECURE", False),
    )


def load_guest_session():
    """Returns the caller's unclaimed GuestSession, or None if their cookie
    is missing/unknown/already claimed (e.g. after they logged in elsewhere).
    Does NOT create one — callers that need a guaranteed session use
    _get_or_create_guest_session instead.
    """
    guest_id = request.cookies.get(GUEST_COOKIE_NAME)
    if not guest_id:
        return None
    gs = db.session.get(GuestSession, guest_id)
    if gs is None or gs.claimed_by_user_id is not None:
        return None
    return gs


def _get_or_create_guest_session():
    gs = load_guest_session()
    if gs is not None:
        return gs, False
    gs = GuestSession(id=uuid.uuid4().hex)
    db.session.add(gs)
    db.session.commit()
    return gs, True


@chat_bp.get("/health")
def health():
    return jsonify({
        "ok": True,
        "vector_db": "chroma",
        "collection": os.getenv("CHROMA_COLLECTION", "ramayana_kb"),
        "authenticated": current_user.is_authenticated,
    })


@chat_bp.get("/chat/history")
def chat_history():
    if current_user.is_authenticated:
        messages = (
            Message.query.filter_by(user_id=current_user.id).order_by(Message.created_at.asc()).all()
        )
        return jsonify({"messages": [m.to_public_dict() for m in messages], "guest": None})

    gs = load_guest_session()
    if gs is None:
        return jsonify({
            "messages": [],
            "guest": {"remaining": GUEST_MESSAGE_LIMIT, "limit": GUEST_MESSAGE_LIMIT},
        })

    messages = (
        Message.query.filter_by(guest_session_id=gs.id).order_by(Message.created_at.asc()).all()
    )
    return jsonify({"messages": [m.to_public_dict() for m in messages], "guest": gs.to_public_dict()})


@chat_bp.post("/chat")
def chat():
    payload = request.get_json(force=True) or {}
    question = (payload.get("question") or "").strip()
    if not question:
        return jsonify({"error": "Missing 'question'"}), 400

    hybrid_index = current_app.extensions.get("hybrid_index")
    if hybrid_index is None:
        return jsonify({"error": "RAG index is not initialized on this server"}), 503

    new_guest_cookie = None
    if current_user.is_authenticated:
        owner_filter = {"user_id": current_user.id}
    else:
        gs, is_new = _get_or_create_guest_session()
        if is_new:
            new_guest_cookie = gs.id
        if gs.remaining <= 0:
            resp = jsonify({
                "error": "guest_limit_reached",
                "message": f"You've used all {GUEST_MESSAGE_LIMIT} free questions as a guest. Sign in to keep chatting — "
                           "this conversation will be saved to your account.",
                "guest": gs.to_public_dict(),
            })
            if new_guest_cookie:
                _set_guest_cookie(resp, new_guest_cookie)
            return resp, 403
        owner_filter = {"guest_session_id": gs.id}

    recent = (
        Message.query.filter_by(**owner_filter).order_by(Message.created_at.desc()).limit(6).all()
    )
    history = [{"role": m.role, "content": m.content} for m in reversed(recent)]

    db.session.add(Message(role="user", content=question, **owner_filter))
    db.session.commit()

    try:
        answer, sources, meta = answer_question(
            question,
            hybrid_index,
            k=current_app.config["RETRIEVAL_K"],
            fetch_k=current_app.config["RETRIEVAL_FETCH_K"],
            score_threshold=current_app.config["RETRIEVAL_SCORE_THRESHOLD"],
            history=history,
        )
    except Exception:
        # The user's question is already saved above regardless of outcome.
        # A provider hiccup (bad/missing API key, rate limit, network blip)
        # shouldn't surface as a raw 500/stack trace to the client.
        current_app.logger.exception("answer_question failed for question: %r", question)
        resp = jsonify({
            "error": "The assistant could not generate a response. Check the server's OPENAI_API_KEY and try again."
        })
        if new_guest_cookie:
            _set_guest_cookie(resp, new_guest_cookie)
        return resp, 502

    db.session.add(
        Message(role="assistant", content=answer, sources_json=json.dumps(sources), meta_json=json.dumps(meta), **owner_filter)
    )

    guest_payload = None
    if not current_user.is_authenticated:
        gs.message_count += 1
        guest_payload = gs.to_public_dict()

    db.session.commit()

    resp = jsonify({"answer": answer, "sources": sources, "guest": guest_payload})
    if new_guest_cookie:
        _set_guest_cookie(resp, new_guest_cookie)
    return resp


@chat_bp.post("/chat/clear")
def clear_chat():
    if current_user.is_authenticated:
        Message.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        return jsonify({"ok": True})

    gs = load_guest_session()
    if gs is not None:
        # Clearing the visible transcript doesn't reset the free-question
        # quota — message_count is left untouched deliberately.
        Message.query.filter_by(guest_session_id=gs.id).delete()
        db.session.commit()
    return jsonify({"ok": True})


@chat_bp.post("/ingest")
@login_required
def ingest():
    """Upload one or more PDFs and index them into Chroma + the hybrid index."""
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files uploaded. Use form-data key 'files'."}), 400

    vectorstore = current_app.extensions.get("vectorstore")
    hybrid_index = current_app.extensions.get("hybrid_index")
    if vectorstore is None or hybrid_index is None:
        return jsonify({"error": "RAG index is not initialized on this server"}), 503

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

    # New chunks just landed in Chroma — rebuild the in-memory BM25 side of
    # the hybrid index so keyword search can find them immediately too.
    hybrid_index.refresh()

    return jsonify({"ok": True, "pages_loaded": doc_count, "chunks_indexed": chunk_count})
