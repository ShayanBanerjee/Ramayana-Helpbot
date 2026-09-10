"""Content moderation gate, run before a message reaches the RAG pipeline.

Uses OpenAI's moderation endpoint (a dedicated, free-to-call classifier —
distinct from the chat model) to catch profanity, hate speech, harassment,
and other harmful content. Deliberately separate from the SMALLTALK/RAMAYANA/
OFF_TOPIC intent classifier in rag.py: that classifier decides *what a
message is about*, this decides *whether it's safe to engage with at all*,
and the two questions shouldn't share a prompt or a failure mode.
"""
import os

_client_singleton = None


def _client():
    global _client_singleton
    if _client_singleton is None:
        from openai import OpenAI
        _client_singleton = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))
    return _client_singleton


def is_flagged(text: str, client=None) -> bool:
    """True if the moderation endpoint flags this text. Fails open (returns
    False) on any moderation-API error — a moderation outage should degrade
    to "no extra filter", not take down chat entirely; the base system
    prompt's tone/scope rules still apply regardless.
    """
    if not text or not text.strip():
        return False
    try:
        client = client or _client()
        result = client.moderations.create(model="omni-moderation-latest", input=text)
        return bool(result.results[0].flagged)
    except Exception:
        return False
