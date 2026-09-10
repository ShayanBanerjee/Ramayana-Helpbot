import json

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from src.extensions import db

GUEST_MESSAGE_LIMIT = 5
GUEST_COOKIE_NAME = "guest_id"


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)  # null for OAuth-only accounts
    avatar_url = db.Column(db.String(1024), nullable=True)
    provider = db.Column(db.String(32), nullable=False, default="local")  # local | google | facebook
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    messages = db.relationship(
        "Message", foreign_keys="Message.user_id", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )

    def set_password(self, raw_password: str) -> None:
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return bool(self.password_hash) and check_password_hash(self.password_hash, raw_password)

    def to_public_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "avatar_url": self.avatar_url,
            "provider": self.provider,
        }


class GuestSession(db.Model):
    """A temporary, unauthenticated conversation identity.

    Tracked via an opaque id handed to the browser as a plain (non-auth)
    cookie — deliberately NOT a User row, since a guest has supplied no
    credentials and shouldn't be modeled as an account. Capped at
    GUEST_MESSAGE_LIMIT prompts; on signup/login its messages are
    reassigned to the new User (see auth.py's _claim_guest_session) and
    `claimed_by_user_id` is stamped for an audit trail rather than deleting
    the row, so the temporary-to-permanent handoff is itself recorded.
    """

    __tablename__ = "guest_sessions"

    id = db.Column(db.String(36), primary_key=True)  # uuid4 hex
    message_count = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    claimed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    claimed_at = db.Column(db.DateTime, nullable=True)

    messages = db.relationship(
        "Message", foreign_keys="Message.guest_session_id", backref="guest_session", lazy="dynamic"
    )

    @property
    def remaining(self) -> int:
        return max(0, GUEST_MESSAGE_LIMIT - self.message_count)

    def to_public_dict(self) -> dict:
        return {"remaining": self.remaining, "limit": GUEST_MESSAGE_LIMIT}


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    # Exactly one of these is set — enforced by the CHECK constraint below,
    # not just application logic, so the invariant holds even if a future
    # code path forgets to check it.
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    guest_session_id = db.Column(db.String(36), db.ForeignKey("guest_sessions.id"), nullable=True, index=True)

    role = db.Column(db.String(16), nullable=False)  # "user" | "assistant"
    content = db.Column(db.Text, nullable=False)
    sources_json = db.Column(db.Text, nullable=True)
    meta_json = db.Column(db.Text, nullable=True)  # retrieval metadata: model, search_query, chunk_count, ...
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (
        db.CheckConstraint(
            "(user_id IS NOT NULL AND guest_session_id IS NULL) OR "
            "(user_id IS NULL AND guest_session_id IS NOT NULL)",
            name="ck_message_single_owner",
        ),
    )

    def to_public_dict(self) -> dict:
        return {
            "role": self.role,
            "content": self.content,
            "sources": json.loads(self.sources_json) if self.sources_json else [],
            "meta": json.loads(self.meta_json) if self.meta_json else None,
            "ts": self.created_at.isoformat() if self.created_at else None,
        }
