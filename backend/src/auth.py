import re
from datetime import datetime, timezone
from functools import wraps

from flask import Blueprint, current_app, jsonify, redirect, request, url_for
from flask_login import current_user, login_required, login_user, logout_user

from src.chat import GUEST_COOKIE_NAME, load_guest_session
from src.extensions import db, oauth
from src.models import Message, User

auth_bp = Blueprint("auth", __name__)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def admin_required(fn):
    """Gate a view to users whose email is in ADMIN_EMAILS (see
    src/config.py). Stacks on top of login_required so an unauthenticated
    caller gets the usual 401 (via the app-wide unauthorized_handler) before
    admin status is even checked.
    """

    @wraps(fn)
    @login_required
    def wrapper(*args, **kwargs):
        if not current_user.is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)

    return wrapper


def _find_or_create_oauth_user(email: str, name: str, avatar_url: str, provider: str) -> User:
    user = User.query.filter_by(email=email).first()
    if user:
        return user
    user = User(email=email, name=name or email.split("@")[0], avatar_url=avatar_url, provider=provider)
    db.session.add(user)
    db.session.commit()
    return user


def _claim_guest_session_for(user: User) -> bool:
    """If the caller has an unclaimed guest session, hand its messages over
    to the newly-authenticated user and mark it claimed (kept, not deleted,
    as an audit trail of the temporary-to-permanent handoff).

    Reassigns rows one at a time rather than a bulk UPDATE: with only up to
    GUEST_MESSAGE_LIMIT*2 rows involved, clarity wins, and it sidesteps any
    ambiguity about bulk-update ordering against the single-owner CHECK
    constraint (each row's user_id/guest_session_id flip happens atomically
    together in the same object, never a state with both or neither set).

    Returns True if a session was claimed (caller should clear the cookie).
    """
    gs = load_guest_session()
    if gs is None:
        return False

    for m in Message.query.filter_by(guest_session_id=gs.id).all():
        m.guest_session_id = None
        m.user_id = user.id

    gs.claimed_by_user_id = user.id
    gs.claimed_at = datetime.now(timezone.utc)
    db.session.commit()
    return True


def _clear_guest_cookie(response):
    response.delete_cookie(GUEST_COOKIE_NAME)


@auth_bp.post("/signup")
def signup():
    payload = request.get_json(force=True) or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400
    if not _EMAIL_RE.match(email):
        return jsonify({"error": "Invalid email address"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(email=email, name=name, provider="local")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    login_user(user)
    claimed = _claim_guest_session_for(user)
    resp = jsonify({"user": user.to_public_dict()})
    if claimed:
        _clear_guest_cookie(resp)
    return resp, 201


@auth_bp.post("/login")
def login():
    payload = request.get_json(force=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or user.provider != "local" or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    login_user(user)
    claimed = _claim_guest_session_for(user)
    resp = jsonify({"user": user.to_public_dict()})
    if claimed:
        _clear_guest_cookie(resp)
    return resp


@auth_bp.post("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"ok": True})


@auth_bp.get("/me")
def me():
    if not current_user.is_authenticated:
        return jsonify({"user": None}), 200
    return jsonify({"user": current_user.to_public_dict()})


@auth_bp.get("/google")
def google_login():
    if "google" not in oauth._registry:
        return jsonify({"error": "Google login is not configured on this server"}), 503
    redirect_uri = url_for("auth.google_callback", _external=True)
    return oauth.google.authorize_redirect(redirect_uri)


@auth_bp.get("/google/callback")
def google_callback():
    token = oauth.google.authorize_access_token()
    userinfo = token.get("userinfo") or oauth.google.parse_id_token(token)
    email = (userinfo.get("email") or "").lower()
    if not email:
        return redirect(f"{current_app.config['FRONTEND_URL']}/?auth_error=google_no_email")

    user = _find_or_create_oauth_user(
        email=email,
        name=userinfo.get("name", ""),
        avatar_url=userinfo.get("picture"),
        provider="google",
    )
    login_user(user)
    claimed = _claim_guest_session_for(user)
    redirect_resp = redirect(current_app.config["FRONTEND_URL"])
    if claimed:
        _clear_guest_cookie(redirect_resp)
    return redirect_resp


@auth_bp.get("/facebook")
def facebook_login():
    if "facebook" not in oauth._registry:
        return jsonify({"error": "Facebook login is not configured on this server"}), 503
    redirect_uri = url_for("auth.facebook_callback", _external=True)
    return oauth.facebook.authorize_redirect(redirect_uri)


@auth_bp.get("/facebook/callback")
def facebook_callback():
    oauth.facebook.authorize_access_token()
    resp = oauth.facebook.get("me?fields=id,name,email,picture.width(200)")
    profile = resp.json()
    email = (profile.get("email") or "").lower()
    if not email:
        # Facebook accounts without a verified email can't be matched to a
        # unique login identity in this schema — ask the user to use email/password instead.
        return redirect(f"{current_app.config['FRONTEND_URL']}/?auth_error=facebook_no_email")

    picture = (profile.get("picture") or {}).get("data", {}).get("url")
    user = _find_or_create_oauth_user(
        email=email, name=profile.get("name", ""), avatar_url=picture, provider="facebook"
    )
    login_user(user)
    claimed = _claim_guest_session_for(user)
    redirect_resp = redirect(current_app.config["FRONTEND_URL"])
    if claimed:
        _clear_guest_cookie(redirect_resp)
    return redirect_resp
