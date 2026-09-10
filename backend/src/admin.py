import json
from collections import Counter
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from src.auth import admin_required
from src.extensions import db
from src.models import AppSetting, GuestSession, Message, User

admin_bp = Blueprint("admin", __name__)

AD_LEVEL_KEY = "ad_level"
MIN_AD_LEVEL = 0
MAX_AD_LEVEL = 2


def _last_n_days(n: int) -> list:
    today = datetime.utcnow().date()
    return [(today - timedelta(days=i)).isoformat() for i in range(n - 1, -1, -1)]


@admin_bp.get("/stats")
@admin_required
def stats():
    # Naive UTC throughout — Message.created_at/User.created_at come from
    # SQLite's server-side CURRENT_TIMESTAMP (server_default=db.func.now()),
    # which is naive, so comparisons here must stay naive too rather than
    # risk a tz-aware/naive string mismatch at the SQL layer.
    now = datetime.utcnow()
    cutoff_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    cutoff_7d = now - timedelta(days=7)
    cutoff_30d = now - timedelta(days=30)

    users_total = User.query.count()
    guest_sessions_total = GuestSession.query.count()
    guest_claimed = GuestSession.query.filter(GuestSession.claimed_by_user_id.isnot(None)).count()
    guest_conversion_rate = round(guest_claimed / guest_sessions_total, 3) if guest_sessions_total else 0.0

    messages_today = Message.query.filter(Message.created_at >= cutoff_today).count()
    messages_7d = Message.query.filter(Message.created_at >= cutoff_7d).count()
    messages_30d = Message.query.filter(Message.created_at >= cutoff_30d).count()

    signups_by_day = {d: 0 for d in _last_n_days(30)}
    for (created_at,) in db.session.query(User.created_at).filter(User.created_at >= cutoff_30d):
        key = created_at.strftime("%Y-%m-%d")
        if key in signups_by_day:
            signups_by_day[key] += 1

    messages_by_day = {d: 0 for d in _last_n_days(30)}
    for (created_at,) in db.session.query(Message.created_at).filter(Message.created_at >= cutoff_30d):
        key = created_at.strftime("%Y-%m-%d")
        if key in messages_by_day:
            messages_by_day[key] += 1

    # meta_json isn't queryable in SQL (it's opaque text), so intent/token
    # aggregation walks assistant rows in Python. Fine at this app's scale —
    # revisit with a materialized rollup if the table ever grows large.
    intent_breakdown = Counter()
    tokens_total = 0
    tokens_30d = 0
    for m in Message.query.filter_by(role="assistant"):
        if not m.meta_json:
            continue
        meta = json.loads(m.meta_json)
        intent_breakdown[meta.get("intent", "unknown")] += 1
        total = (meta.get("tokens") or {}).get("total_tokens", 0)
        tokens_total += total
        if m.created_at and m.created_at >= cutoff_30d:
            tokens_30d += total

    question_counts = Counter()
    for (content,) in db.session.query(Message.content).filter_by(role="user"):
        question_counts[content.strip().lower()] += 1
    top_questions = [{"question": q, "count": c} for q, c in question_counts.most_common(10)]

    return jsonify({
        "users_total": users_total,
        "guest_sessions_total": guest_sessions_total,
        "guest_conversion_rate": guest_conversion_rate,
        "messages_today": messages_today,
        "messages_7d": messages_7d,
        "messages_30d": messages_30d,
        "signups_by_day": signups_by_day,
        "messages_by_day": messages_by_day,
        "intent_breakdown": dict(intent_breakdown),
        "tokens_total": tokens_total,
        "tokens_30d": tokens_30d,
        "top_questions": top_questions,
    })


@admin_bp.get("/ad-level")
def get_ad_level():
    # Deliberately unauthenticated — every visitor's UI needs this to decide
    # what (if anything) to render, not just admins.
    row = db.session.get(AppSetting, AD_LEVEL_KEY)
    return jsonify({"level": int(row.value) if row else 0})


@admin_bp.post("/ad-level")
@admin_required
def set_ad_level():
    payload = request.get_json(force=True) or {}
    level = payload.get("level")
    if not isinstance(level, int) or isinstance(level, bool) or not (MIN_AD_LEVEL <= level <= MAX_AD_LEVEL):
        return jsonify({"error": f"'level' must be an integer between {MIN_AD_LEVEL} and {MAX_AD_LEVEL}"}), 400

    row = db.session.get(AppSetting, AD_LEVEL_KEY)
    if row is None:
        db.session.add(AppSetting(key=AD_LEVEL_KEY, value=str(level)))
    else:
        row.value = str(level)
    db.session.commit()
    return jsonify({"level": level})
