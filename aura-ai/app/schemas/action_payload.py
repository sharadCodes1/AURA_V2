"""
THE shared contract between aura-ai and aura-fe.

aura-ai emits an ActionPayload over the WebSocket; aura-fe's Tauri/Rust layer
executes it. Both repos MUST agree on this shape. It is versioned (schema_version)
so it can evolve without breaking older frontends.

A human-readable copy lives in docs/action-payload-contract.md at the repo root.
"""
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

SCHEMA_VERSION = 1


class ActionType(str, Enum):
    OPEN_APP = "open_app"
    CLOSE_APP = "close_app"
    TYPE_TEXT = "type_text"
    CLICK = "click"
    SCROLL = "scroll"
    SYSTEM_CONTROL = "system_control"   # volume, brightness, lock, shutdown, ...
    RUN_MACRO = "run_macro"             # expands to a list of steps
    UNKNOWN = "unknown"                 # could not resolve; ask the user to retry


class ActionPayload(BaseModel):
    """One executable instruction sent to the frontend."""

    schema_version: int = SCHEMA_VERSION
    action: ActionType = ActionType.UNKNOWN
    target: str = ""                     # e.g. "chrome", or text to type
    params: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 0.0              # 0.0–1.0
    spoken_response: str = ""            # what TTS should say back

    # Only set when action == RUN_MACRO: the ordered steps to execute.
    steps: Optional[List["ActionPayload"]] = None


ActionPayload.model_rebuild()


def unknown_action(spoken_response: str = "Sorry, I didn't catch that.") -> ActionPayload:
    return ActionPayload(action=ActionType.UNKNOWN, confidence=0.0, spoken_response=spoken_response)
