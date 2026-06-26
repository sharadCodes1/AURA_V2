"""
Agent node: turn a transcript into an ActionPayload using Gemini (with a rule-based
fallback). Replaces the old classify_intent -> resolver path for non-macro input.

Gemini handles commands, conversation, and grounded live-data answers; if it's
unavailable, we fall back to the offline rule matcher.
"""
import logging

from app.graph.state import VoiceState
from app.schemas.action_payload import ActionType, unknown_action
from app.services.gemini_agent import gemini_agent
from app.services.rule_fallback import resolve_with_rules

logger = logging.getLogger("aura.node.agent")


async def agent_node(state: VoiceState) -> VoiceState:
    transcript = state.get("transcript", "").strip()
    if not transcript:
        payload = unknown_action("")
    elif gemini_agent.available:
        payload = await gemini_agent.resolve(transcript)
    else:
        payload = resolve_with_rules(transcript)

    # CONVERSE replies and successful actions are "success"; only true non-matches
    # (rule fallback with no LLM) are "ambiguous".
    status = "ambiguous" if payload.action == ActionType.UNKNOWN else "success"
    return {
        "action_payload": payload.model_dump(),
        "response_text": payload.spoken_response,
        "status": status,
    }
