"""
Intent node: classify a transcript into an intent + entities.

Rule-based (regex) by design — fast, offline, zero-cost, and easy to reason about
for a fixed command vocabulary. Swap in an LLM call here later if free-form language
coverage becomes necessary (see resolver_node for where the payload is built).
"""
import re

from app.graph.state import VoiceState
from app.schemas.action_payload import ActionType

# Common spoken app names -> canonical target the frontend executor understands.
APP_ALIASES = {
    "chrome": "chrome", "google chrome": "chrome", "browser": "chrome",
    "firefox": "firefox",
    "vs code": "vscode", "vscode": "vscode", "code": "vscode", "visual studio code": "vscode",
    "terminal": "terminal", "iterm": "terminal",
    "spotify": "spotify",
    "notes": "notes",
    "calculator": "calculator",
    "finder": "finder", "files": "finder", "explorer": "finder",
    "mail": "mail", "email": "mail",
    "slack": "slack",
}

_OPEN = re.compile(r"\b(open|launch|start|run)\b\s+(?P<app>.+)", re.I)
_CLOSE = re.compile(r"\b(close|quit|exit|kill|stop)\b\s+(?P<app>.+)", re.I)
_TYPE = re.compile(r"\b(type|write|enter|input)\b\s+(?P<text>.+)", re.I)
_SCROLL = re.compile(r"\bscroll\b\s*(?P<dir>up|down|left|right)?", re.I)
_CLICK = re.compile(r"\bclick\b\s*(on\s+)?(?P<target>.+)?", re.I)

SYSTEM_PATTERNS = [
    (re.compile(r"\b(volume|sound)\s+up\b", re.I), {"control": "volume", "direction": "up"}),
    (re.compile(r"\b(volume|sound)\s+down\b", re.I), {"control": "volume", "direction": "down"}),
    (re.compile(r"\b(mute|unmute)\b", re.I), {"control": "mute"}),
    (re.compile(r"\bbrightness\s+up\b", re.I), {"control": "brightness", "direction": "up"}),
    (re.compile(r"\bbrightness\s+down\b", re.I), {"control": "brightness", "direction": "down"}),
    (re.compile(r"\b(lock)\b.*\bscreen\b|\block\b", re.I), {"control": "lock"}),
    (re.compile(r"\b(shut\s*down|power\s*off)\b", re.I), {"control": "shutdown"}),
    (re.compile(r"\b(restart|reboot)\b", re.I), {"control": "restart"}),
    (re.compile(r"\b(sleep)\b", re.I), {"control": "sleep"}),
    (re.compile(r"\b(screenshot|screen\s*shot)\b", re.I), {"control": "screenshot"}),
]


def _canonical_app(raw: str) -> str:
    cleaned = re.sub(r"\b(app|application|the)\b", "", raw, flags=re.I).strip(" .!?")
    cleaned = cleaned.lower().strip()
    return APP_ALIASES.get(cleaned, cleaned)


def intent_node(state: VoiceState) -> VoiceState:
    text = state.get("transcript", "").strip()
    if not text:
        return {"intent": ActionType.UNKNOWN.value, "entities": {}}

    # System controls first (most specific).
    for pattern, entities in SYSTEM_PATTERNS:
        if pattern.search(text):
            return {"intent": ActionType.SYSTEM_CONTROL.value, "entities": dict(entities)}

    if m := _OPEN.search(text):
        return {"intent": ActionType.OPEN_APP.value, "entities": {"app": _canonical_app(m.group("app"))}}

    if m := _CLOSE.search(text):
        return {"intent": ActionType.CLOSE_APP.value, "entities": {"app": _canonical_app(m.group("app"))}}

    if m := _TYPE.search(text):
        return {"intent": ActionType.TYPE_TEXT.value, "entities": {"text": m.group("text").strip()}}

    if m := _SCROLL.search(text):
        return {"intent": ActionType.SCROLL.value, "entities": {"direction": (m.group("dir") or "down").lower()}}

    if m := _CLICK.search(text):
        target = (m.group("target") or "").strip(" .!?")
        return {"intent": ActionType.CLICK.value, "entities": {"target": target}}

    return {"intent": ActionType.UNKNOWN.value, "entities": {}}
