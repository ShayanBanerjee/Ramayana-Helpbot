"""Shared Flask extension instances.

Kept in one module (rather than instantiated inside create_app) so blueprint
modules can import them directly without circular imports on the app factory.
"""
from authlib.integrations.flask_client import OAuth
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
login_manager = LoginManager()
oauth = OAuth()

login_manager.session_protection = "strong"
