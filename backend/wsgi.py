"""Production entrypoint: `gunicorn wsgi:app` (see deploy/grantha.service)."""
from dotenv import load_dotenv

load_dotenv()  # must run before ProdConfig reads env vars at class-definition time

from werkzeug.middleware.proxy_fix import ProxyFix  # noqa: E402

from app import create_app  # noqa: E402
from src.config import ProdConfig  # noqa: E402

ProdConfig.validate()
app = create_app(ProdConfig)
# Behind nginx: trust X-Forwarded-Proto/Host so url_for(_external=True) (OAuth
# redirect URIs) and the secure-cookie logic see https://askgrantha.com.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
