from tests.conftest import signup


def test_signup_creates_user_and_logs_in(client):
    r = signup(client)
    assert r.status_code == 201
    body = r.get_json()
    assert body["user"]["email"] == "user@example.com"
    assert body["user"]["provider"] == "local"

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.get_json()["user"]["email"] == "user@example.com"


def test_signup_missing_fields_rejected(client):
    r = client.post("/api/auth/signup", json={"email": "a@b.com", "password": "supersecret"})
    assert r.status_code == 400


def test_signup_invalid_email_rejected(client):
    r = signup(client, email="not-an-email")
    assert r.status_code == 400


def test_signup_short_password_rejected(client):
    r = signup(client, password="short")
    assert r.status_code == 400


def test_signup_duplicate_email_rejected(client):
    assert signup(client).status_code == 201
    r2 = signup(client)
    assert r2.status_code == 409


def test_login_wrong_password_rejected(client):
    signup(client)
    client.post("/api/auth/logout")
    r = client.post("/api/auth/login", json={"email": "user@example.com", "password": "wrongpassword"})
    assert r.status_code == 401


def test_login_unknown_email_rejected(client):
    r = client.post("/api/auth/login", json={"email": "ghost@example.com", "password": "supersecret"})
    assert r.status_code == 401


def test_login_success(client):
    signup(client)
    client.post("/api/auth/logout")
    r = client.post("/api/auth/login", json={"email": "user@example.com", "password": "supersecret"})
    assert r.status_code == 200
    assert r.get_json()["user"]["email"] == "user@example.com"


def test_me_anonymous_returns_null_user(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.get_json()["user"] is None


def test_logout_clears_session(client):
    signup(client)
    r = client.post("/api/auth/logout")
    assert r.status_code == 200

    me = client.get("/api/auth/me")
    assert me.get_json()["user"] is None


def test_logout_requires_login(client):
    r = client.post("/api/auth/logout")
    assert r.status_code == 401


def test_google_login_disabled_without_config(client):
    r = client.get("/api/auth/google")
    assert r.status_code == 503


def test_facebook_login_disabled_without_config(client):
    r = client.get("/api/auth/facebook")
    assert r.status_code == 503
