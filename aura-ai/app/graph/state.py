"""Shared state passed between LangGraph nodes."""
from typing import Any, Dict, List, Optional, TypedDict


class VoiceState(TypedDict, total=False):
    # --- inputs ---
    user_id: int
    audio_chunk: bytes          # raw audio (WebSocket path); empty for text input
    transcript: str             # set directly for /api/process-text, or by stt_node

    # --- macro lookup ---
    macros: List[Dict[str, Any]]  # the user's saved macros (fetched once)
    is_macro: bool
    matched_macro: Optional[Dict[str, Any]]

    # --- intent ---
    intent: str
    entities: Dict[str, Any]

    # --- outputs ---
    action_payload: Dict[str, Any]   # serialized ActionPayload
    response_text: str
    response_audio: bytes
    status: str                      # success | failed | ambiguous
