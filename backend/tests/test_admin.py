from tests.conftest import signup


def test_stats_requires_login(client):
    r = client.get("/api/admin/stats")
    assert r.status_code == 401


def test_stats_rejects_non_admin(app, client):
    app.config["ADMIN_EMAILS"] = []
    signup(client, email="regular@example.com")
    r = client.get("/api/admin/stats")
    assert r.status_code == 403


def test_stats_allows_admin_and_returns_expected_shape(app, client):
    app.config["ADMIN_EMAILS"] = ["admin@example.com"]
    signup(client, email="admin@example.com")
    client.post("/api/chat/clear")  # no-op; just confirms an authenticated session works

    r = client.get("/api/admin/stats")
    assert r.status_code == 200
    body = r.json
    for key in (
        "users_total",
        "guest_sessions_total",
        "guest_conversion_rate",
        "messages_today",
        "messages_7d",
        "messages_30d",
        "signups_by_day",
        "messages_by_day",
        "intent_breakdown",
        "tokens_total",
        "tokens_30d",
        "top_questions",
    ):
        assert key in body
    assert body["users_total"] == 1
    assert len(body["signups_by_day"]) == 30


def test_admin_email_check_is_case_insensitive(app, client):
    app.config["ADMIN_EMAILS"] = ["admin@example.com"]
    signup(client, email="Admin@Example.com")
    r = client.get("/api/admin/stats")
    assert r.status_code == 200


def test_ad_level_defaults_to_zero(client):
    r = client.get("/api/admin/ad-level")
    assert r.status_code == 200
    assert r.json == {"level": 0}


def test_ad_level_post_requires_admin(app, client):
    app.config["ADMIN_EMAILS"] = []
    signup(client, email="regular2@example.com")
    r = client.post("/api/admin/ad-level", json={"level": 1})
    assert r.status_code == 403


def test_ad_level_post_and_get_roundtrip(app, client):
    app.config["ADMIN_EMAILS"] = ["admin2@example.com"]
    signup(client, email="admin2@example.com")

    r = client.post("/api/admin/ad-level", json={"level": 2})
    assert r.status_code == 200
    assert r.json == {"level": 2}

    r = client.get("/api/admin/ad-level")
    assert r.json == {"level": 2}


def test_ad_level_post_rejects_out_of_range(app, client):
    app.config["ADMIN_EMAILS"] = ["admin3@example.com"]
    signup(client, email="admin3@example.com")

    r = client.post("/api/admin/ad-level", json={"level": 5})
    assert r.status_code == 400

    r = client.post("/api/admin/ad-level", json={"level": "2"})
    assert r.status_code == 400
