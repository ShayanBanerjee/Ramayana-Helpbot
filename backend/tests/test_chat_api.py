import io

from src.models import GUEST_MESSAGE_LIMIT
from tests.conftest import signup


def test_ingest_requires_login(client, fake_hybrid_index):
    r = client.post("/api/ingest", data={}, content_type="multipart/form-data")
    assert r.status_code == 401


def test_ingest_requires_files(client, fake_hybrid_index):
    signup(client)
    r = client.post("/api/ingest", data={}, content_type="multipart/form-data")
    assert r.status_code == 400


def test_ingest_rejects_non_pdf(client, fake_hybrid_index):
    signup(client)
    data = {"files": (io.BytesIO(b"not a pdf"), "notes.txt")}
    r = client.post("/api/ingest", data=data, content_type="multipart/form-data")
    assert r.status_code == 400


def test_ingest_indexes_pdf_and_refreshes_hybrid_index(client, fake_hybrid_index, monkeypatch):
    signup(client)

    refreshed = {"called": False}
    monkeypatch.setattr(fake_hybrid_index, "refresh", lambda: refreshed.__setitem__("called", True))
    monkeypatch.setattr("src.chat.ingest_pdfs_into_vectorstore", lambda paths, vs: (2, 5))

    data = {"files": (io.BytesIO(b"%PDF-1.4 fake pdf bytes"), "ramayana.pdf")}
    r = client.post("/api/ingest", data=data, content_type="multipart/form-data")

    assert r.status_code == 200
    body = r.get_json()
    assert body == {"ok": True, "pages_loaded": 2, "chunks_indexed": 5}
    assert refreshed["called"] is True


def test_chat_works_for_anonymous_guest(client, fake_hybrid_index, fake_llm):
    # Guest chat is intentionally allowed — see tests/test_guest_flow.py for
    # the full 10-question gating and claim-on-login behavior.
    r = client.post("/api/chat", json={"question": "Who is Hanuman?"})
    assert r.status_code == 200
    assert r.get_json()["guest"]["remaining"] == GUEST_MESSAGE_LIMIT - 1


def test_chat_requires_question(client, fake_hybrid_index, fake_llm):
    signup(client)
    r = client.post("/api/chat", json={})
    assert r.status_code == 400


def test_chat_returns_grounded_answer_with_sources(client, fake_hybrid_index, fake_llm):
    signup(client)
    fake_llm.default = "Hanuman is a devoted vanara warrior."

    r = client.post("/api/chat", json={"question": "Who is Hanuman?"})
    assert r.status_code == 200
    body = r.get_json()
    assert body["answer"] == "Hanuman is a devoted vanara warrior."
    assert body["sources"][0]["source_file"] == "ramayana.pdf"
    # PyPDFLoader's 0-indexed page (4) must be shown as the human page number (5).
    assert body["sources"][0]["page"] == 5


def test_chat_smalltalk_gets_a_reply_without_sources_or_rag_chunks(client, fake_hybrid_index, fake_llm):
    signup(client)
    fake_llm.script = {
        "Classify the user's message": "SMALLTALK",
        "Reply briefly and naturally": "Namaste! Ask me anything about Rama's story.",
    }

    r = client.post("/api/chat", json={"question": "hi!"})
    assert r.status_code == 200
    body = r.get_json()
    assert body["answer"] == "Namaste! Ask me anything about Rama's story."
    assert body["sources"] == []
    assert fake_hybrid_index.queries_seen == []  # no retrieval spent on small talk


def test_chat_off_topic_gets_redirected_instead_of_answered(client, fake_hybrid_index, fake_llm):
    signup(client)
    fake_llm.script = {"Classify the user's message": "OFF_TOPIC"}

    r = client.post("/api/chat", json={"question": "write me a bubble sort in Python"})
    assert r.status_code == 200
    body = r.get_json()
    assert "Valmiki Ramayana" in body["answer"]
    assert body["sources"] == []
    assert fake_hybrid_index.queries_seen == []


def test_chat_persists_messages_to_history(client, fake_hybrid_index, fake_llm):
    signup(client)
    client.post("/api/chat", json={"question": "Who is Hanuman?"})

    history = client.get("/api/chat/history").get_json()["messages"]
    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "Who is Hanuman?"
    assert history[1]["role"] == "assistant"
    assert history[1]["sources"][0]["source_file"] == "ramayana.pdf"


def test_chat_history_is_per_user(client, fake_hybrid_index, fake_llm):
    signup(client, email="a@example.com")
    client.post("/api/chat", json={"question": "Who is Hanuman?"})
    client.post("/api/auth/logout")

    signup(client, email="b@example.com")
    history = client.get("/api/chat/history").get_json()["messages"]
    assert history == []


def test_chat_returns_clean_error_when_llm_call_fails(client, fake_hybrid_index, monkeypatch):
    signup(client)

    def _boom():
        raise RuntimeError("openai.AuthenticationError: invalid api key")

    monkeypatch.setattr("src.rag._make_llm", _boom)

    r = client.post("/api/chat", json={"question": "Who is Hanuman?"})
    assert r.status_code == 502
    assert "OPENAI_API_KEY" in r.get_json()["error"]

    # The user's question is still saved even though the answer failed.
    history = client.get("/api/chat/history").get_json()["messages"]
    assert len(history) == 1
    assert history[0]["role"] == "user"


def test_chat_uses_recent_history_for_contextualization(client, fake_hybrid_index, fake_llm):
    signup(client)
    client.post("/api/chat", json={"question": "Who is Hanuman?"})
    client.post("/api/chat", json={"question": "What about his brother?"})

    # Second call's contextualize step should have seen the first turn.
    assert any("Who is Hanuman?" in call for call in fake_llm.calls)


def test_clear_chat_removes_history(client, fake_hybrid_index, fake_llm):
    signup(client)
    client.post("/api/chat", json={"question": "Who is Hanuman?"})
    assert len(client.get("/api/chat/history").get_json()["messages"]) == 2

    r = client.post("/api/chat/clear")
    assert r.status_code == 200
    assert client.get("/api/chat/history").get_json()["messages"] == []


def test_health_reports_auth_state(client, fake_hybrid_index, fake_llm):
    anon = client.get("/api/health").get_json()
    assert anon["authenticated"] is False

    signup(client)
    authed = client.get("/api/health").get_json()
    assert authed["authenticated"] is True
