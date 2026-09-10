import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from src.config import DevConfig
from src.extensions import db, login_manager, oauth
from src.models import User


def create_app(config_object=None):
    load_dotenv()

    app = Flask(__name__)
    app.config.from_object(config_object or DevConfig)

    CORS(app, supports_credentials=True, origins=[app.config["FRONTEND_URL"]])

    db.init_app(app)
    login_manager.init_app(app)
    oauth.init_app(app)
    _register_oauth_providers(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        from flask import jsonify
        return jsonify({"error": "Authentication required"}), 401

    with app.app_context():
        db.create_all()

    if not app.config.get("SKIP_RAG_INIT"):
        _init_rag(app)

    from src.auth import auth_bp
    from src.chat import chat_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(chat_bp, url_prefix="/api")

    return app


def _register_oauth_providers(app):
    if app.config.get("GOOGLE_CLIENT_ID"):
        oauth.register(
            name="google",
            client_id=app.config["GOOGLE_CLIENT_ID"],
            client_secret=app.config["GOOGLE_CLIENT_SECRET"],
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )
    if app.config.get("FACEBOOK_CLIENT_ID"):
        oauth.register(
            name="facebook",
            client_id=app.config["FACEBOOK_CLIENT_ID"],
            client_secret=app.config["FACEBOOK_CLIENT_SECRET"],
            access_token_url="https://graph.facebook.com/oauth/access_token",
            authorize_url="https://www.facebook.com/dialog/oauth",
            api_base_url="https://graph.facebook.com/",
            client_kwargs={"scope": "email public_profile"},
        )


def _init_rag(app):
    """Loads the embedding model, opens Chroma, and builds the hybrid
    BM25+vector retrieval index once at startup — kept off the request path
    (and off the test suite, via SKIP_RAG_INIT) since it downloads/loads ML
    models and reads the full vector store corpus into memory.
    """
    from src.helper import download_embeddings_model
    from src.retrieval import HybridIndex
    from src.vectorstore import get_chroma_vectorstore

    embedding = download_embeddings_model(app.config["EMBEDDING_MODEL"])
    vectorstore = get_chroma_vectorstore(embedding)
    hybrid_index = HybridIndex(vectorstore, app.config["RERANKER_MODEL"])

    app.extensions["vectorstore"] = vectorstore
    app.extensions["hybrid_index"] = hybrid_index


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", "8080"))
    app.run(host="0.0.0.0", port=port, debug=app.config.get("DEBUG", False))
