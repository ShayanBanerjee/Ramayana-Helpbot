import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from langchain_core.documents import Document

from app import create_app
from src.config import TestConfig
from src.extensions import db as _db


class FakeLLM:
    """Stands in for ChatOpenAI. `script` maps a substring of the prompt to
    a canned response, so tests can control what "the model" says without
    any network access."""

    def __init__(self, default="Fake answer.", script=None):
        self.default = default
        self.script = script or {}
        self.calls = []

    def invoke(self, prompt):
        self.calls.append(prompt)
        for needle, response in self.script.items():
            if needle in prompt:
                return type("Resp", (), {"content": response})()
        return type("Resp", (), {"content": self.default})()


class FakeHybridIndex:
    """Stands in for HybridIndex. Returns whatever (Document, score) pairs
    it was constructed with, regardless of query, so RAG-layer tests don't
    need a real vector store or cross-encoder."""

    def __init__(self, scored_docs=None):
        self.scored_docs = scored_docs if scored_docs is not None else [
            (
                Document(
                    page_content="Hanuman is a vanara devoted to Rama, known for his strength and loyalty.",
                    metadata={"source_file": "ramayana.pdf", "page": 4},
                ),
                0.87,
            )
        ]
        self.queries_seen = []

    def retrieve(self, query, k=6, fetch_k=20, score_threshold=0.25):
        self.queries_seen.append(query)
        return self.scored_docs[:k]

    def refresh(self):
        pass


@pytest.fixture(autouse=True)
def _default_moderation_passthrough(monkeypatch):
    # Without this, is_flagged() would attempt a real network call to
    # OpenAI's moderation endpoint on every RAG test (failing open, but
    # slowly). Tests that exercise the blocked path monkeypatch this back
    # to raise/True themselves.
    monkeypatch.setattr("src.rag.is_flagged", lambda text: False)


@pytest.fixture(autouse=True)
def _reset_oauth_registry():
    # `oauth` is a module-level singleton shared across every test in the
    # session — without resetting it, a provider registered by one test
    # (e.g. to test _register_oauth_providers) would leak into unrelated
    # tests and change their behavior (and could trigger a real network
    # call to Google/Facebook from an otherwise-offline test).
    from src.extensions import oauth as _oauth

    _oauth._registry = {}
    _oauth._clients = {}
    yield
    _oauth._registry = {}
    _oauth._clients = {}


@pytest.fixture()
def app():
    application = create_app(TestConfig)
    with application.app_context():
        yield application
        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def fake_hybrid_index(app):
    idx = FakeHybridIndex()
    app.extensions["hybrid_index"] = idx
    # A non-None sentinel: the chat/ingest routes only check "is it configured"
    # (`is None`), they never call methods on it directly — ingestion goes
    # through `ingest_pdfs_into_vectorstore`, which tests monkeypatch.
    app.extensions["vectorstore"] = object()
    return idx


@pytest.fixture()
def fake_llm(monkeypatch):
    llm = FakeLLM()
    monkeypatch.setattr("src.rag._make_llm", lambda: llm)
    return llm


def signup(client, email="user@example.com", password="supersecret", name="Test User"):
    return client.post("/api/auth/signup", json={"name": name, "email": email, "password": password})
