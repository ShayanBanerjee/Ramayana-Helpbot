from app import _register_oauth_providers
from src.extensions import oauth


def test_register_oauth_providers_registers_google_and_facebook_when_configured(app):
    app.config["GOOGLE_CLIENT_ID"] = "test-google-id"
    app.config["GOOGLE_CLIENT_SECRET"] = "test-google-secret"
    app.config["FACEBOOK_CLIENT_ID"] = "test-fb-id"
    app.config["FACEBOOK_CLIENT_SECRET"] = "test-fb-secret"

    _register_oauth_providers(app)

    assert "google" in oauth._registry
    assert "facebook" in oauth._registry


def test_register_oauth_providers_skips_unconfigured_providers(app):
    # TestConfig ships with empty client IDs — nothing should register.
    _register_oauth_providers(app)
    assert "google" not in oauth._registry
    assert "facebook" not in oauth._registry
