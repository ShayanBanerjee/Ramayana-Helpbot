import os


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///ramayana_helpbot.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Frontend origin OAuth callbacks redirect back to once a session cookie is set.
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

    FACEBOOK_CLIENT_ID = os.getenv("FACEBOOK_CLIENT_ID", "")
    FACEBOOK_CLIENT_SECRET = os.getenv("FACEBOOK_CLIENT_SECRET", "")

    # Admin panel access: an allowlist rather than a DB flag, so granting/
    # revoking access is a config change, not a migration. Empty by default
    # — nobody is an admin until this is explicitly set.
    ADMIN_EMAILS = [e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()]

    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    RERANKER_MODEL = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

    CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_store")
    CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "ramayana_kb")
    PDF_DIR = os.getenv("PDF_DIR", "./data")

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    RETRIEVAL_K = int(os.getenv("RETRIEVAL_K", "6"))
    RETRIEVAL_FETCH_K = int(os.getenv("RETRIEVAL_FETCH_K", "20"))
    RETRIEVAL_SCORE_THRESHOLD = float(os.getenv("RETRIEVAL_SCORE_THRESHOLD", "0.25"))

    # Skips loading the embedding model / Chroma / cross-encoder at app-init
    # time. Tests inject fake RAG components instead, since pulling real ML
    # models over the network has no place in a unit test suite.
    SKIP_RAG_INIT = False


class DevConfig(BaseConfig):
    DEBUG = True


class TestConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SECRET_KEY = "test-secret"
    WTF_CSRF_ENABLED = False
    SKIP_RAG_INIT = True
