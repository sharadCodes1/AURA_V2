"""
Offline fallback: resolve a transcript with the rule-based matcher.

Used when Gemini is unavailable (no key / no SDK / network or quota error) so the app
still handles the basic OS commands. Reuses the existing intent + resolver logic.
"""
from app.graph.nodes.intent_node import intent_node
from app.graph.nodes.resolver_node import _resolve_intent
from app.schemas.action_payload import ActionPayload


def resolve_with_rules(transcript: str) -> ActionPayload:
    classified = intent_node({"transcript": transcript})
    return _resolve_intent(classified.get("intent", ""), classified.get("entities", {}))
