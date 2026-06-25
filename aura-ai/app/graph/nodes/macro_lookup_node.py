"""Macro lookup node: does the transcript match one of the user's saved macros?

Macros are expected to be pre-loaded into state["macros"] by the caller (the
WebSocket / REST handler fetches them once via the backend client). Matching is a
simple normalized comparison / substring against each macro's trigger_phrase.
"""
import logging

from app.graph.state import VoiceState

logger = logging.getLogger("aura.node.macro")


def _normalize(text: str) -> str:
    return " ".join(text.lower().strip().split())


def macro_lookup_node(state: VoiceState) -> VoiceState:
    transcript = _normalize(state.get("transcript", ""))
    if not transcript:
        return {"is_macro": False, "matched_macro": None}

    for macro in state.get("macros", []):
        trigger = _normalize(macro.get("trigger_phrase", ""))
        if trigger and (trigger == transcript or trigger in transcript):
            logger.info("Matched macro %r", macro.get("trigger_phrase"))
            return {"is_macro": True, "matched_macro": macro}

    return {"is_macro": False, "matched_macro": None}
