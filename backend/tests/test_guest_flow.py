from src.models import GUEST_MESSAGE_LIMIT, GuestSession, Message
from tests.conftest import signup


def _ask(client, text="Who is Hanuman?"):
    return client.post("/api/chat", json={"question": text})


def test_first_guest_message_sets_a_cookie_and_counts_down(client, fake_hybrid_index, fake_llm):
    r = _ask(client)
    assert r.status_code == 200
    assert r.get_json()["guest"] == {"remaining": GUEST_MESSAGE_LIMIT - 1, "limit": GUEST_MESSAGE_LIMIT}
    assert "guest_id" in r.headers.get("Set-Cookie", "")


def test_guest_history_persists_across_requests_via_cookie(client, fake_hybrid_index, fake_llm):
    _ask(client, "Who is Hanuman?")
    history = client.get("/api/chat/history").get_json()
    assert len(history["messages"]) == 2
    assert history["guest"]["remaining"] == GUEST_MESSAGE_LIMIT - 1


def test_guest_is_gated_after_the_free_limit(client, fake_hybrid_index, fake_llm, app):
    for i in range(GUEST_MESSAGE_LIMIT):
        r = _ask(client, f"Question number {i}")
        assert r.status_code == 200

    r = _ask(client, "One too many")
    assert r.status_code == 403
    body = r.get_json()
    assert body["error"] == "guest_limit_reached"
    assert body["guest"]["remaining"] == 0

    with app.app_context():
        assert GuestSession.query.count() == 1
        assert GuestSession.query.first().message_count == GUEST_MESSAGE_LIMIT


def test_two_anonymous_clients_get_independent_guest_sessions(client, fake_hybrid_index, fake_llm):
    _ask(client, "From client A")
    history_a = client.get("/api/chat/history").get_json()["messages"]
    assert len(history_a) == 2

    # A fresh test client has its own cookie jar — simulates a second,
    # unrelated anonymous visitor hitting the same running server.
    other = client.application.test_client()
    history_b = other.get("/api/chat/history").get_json()
    assert history_b["messages"] == []
    assert history_b["guest"]["remaining"] == GUEST_MESSAGE_LIMIT


def test_signup_claims_guest_session_messages(client, fake_hybrid_index, fake_llm, app):
    _ask(client, "Who is Hanuman?")
    _ask(client, "What about his brother?")

    r = signup(client, email="claimer@example.com")
    assert r.status_code == 201

    history = client.get("/api/chat/history").get_json()["messages"]
    assert len(history) == 4  # the two guest Q&A pairs followed the user in
    assert history[0]["content"] == "Who is Hanuman?"

    with app.app_context():
        gs = GuestSession.query.first()
        assert gs.claimed_by_user_id is not None
        assert gs.claimed_at is not None
        # Every message now belongs to the user, none to the guest session.
        assert Message.query.filter_by(guest_session_id=gs.id).count() == 0


def test_login_claims_guest_session_messages(client, fake_hybrid_index, fake_llm, app):
    signup(client, email="preexisting@example.com")
    client.post("/api/auth/logout")

    _ask(client, "Who is Hanuman?")

    r = client.post("/api/auth/login", json={"email": "preexisting@example.com", "password": "supersecret"})
    assert r.status_code == 200

    history = client.get("/api/chat/history").get_json()["messages"]
    assert len(history) == 2


def test_claimed_guest_cookie_is_cleared_so_it_cannot_be_reused(client, fake_hybrid_index, fake_llm):
    _ask(client)
    r = signup(client, email="claimer2@example.com")
    set_cookie = r.headers.get("Set-Cookie", "")
    assert "guest_id=;" in set_cookie or "guest_id=;" in set_cookie.replace(" ", "")


def test_guest_clear_chat_does_not_reset_quota(client, fake_hybrid_index, fake_llm, app):
    asked_before_clear = GUEST_MESSAGE_LIMIT - 2
    for i in range(asked_before_clear):
        _ask(client, f"Question {i}")

    r = client.post("/api/chat/clear")
    assert r.status_code == 200
    assert client.get("/api/chat/history").get_json()["messages"] == []

    # Quota is unaffected by clearing — one more question still counts down
    # from where it left off, not from a reset full quota.
    r = _ask(client, "Another one")
    assert r.get_json()["guest"]["remaining"] == GUEST_MESSAGE_LIMIT - asked_before_clear - 1


def test_guest_message_metadata_is_stored(client, fake_hybrid_index, fake_llm, app):
    _ask(client, "Who is Hanuman?")

    with app.app_context():
        assistant_msg = Message.query.filter_by(role="assistant").first()
        assert assistant_msg.meta_json is not None
        import json
        meta = json.loads(assistant_msg.meta_json)
        assert "model" in meta
        assert "search_query" in meta
        assert "chunk_count" in meta
