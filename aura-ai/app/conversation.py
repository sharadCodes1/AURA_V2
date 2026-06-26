"""
Wake-word and conversation-state helpers for hands-free mode.

The wake word is "Hi Aura". Whisper often mishears "Aura" (ora / arora / aurora /
laura), so the matcher is deliberately fuzzy. Once awake, AURA keeps acting on what
it hears until a sleep phrase ("stop listening", "go to sleep", "goodbye", ...).
"""
import re

from app.config import settings

# greeting word + an "aura"-ish token
WAKE_RE = re.compile(
    r"\b(hi|hey|hello|ok|okay|yo)\s+(aura|ora|arora|aurora|aaura|laura|orla|aura,)\b",
    re.I,
)

SLEEP_RE = re.compile(
    r"\b(go to sleep|stop listening|that'?s all|never mind|goodbye|bye aura|sleep now|"
    r"go away|dismiss)\b",
    re.I,
)

GREETING = f"Hey {settings.user_name}, I'm listening."
SLEEP_REPLY = f"Going to sleep. Say Hi Aura when you need me, {settings.user_name}."


def detect_wake(transcript: str):
    """
    Return (woke, remainder). If the wake word is present, `remainder` is whatever the
    user said after it (so "Hi Aura, open chrome" wakes AND runs "open chrome").
    """
    m = WAKE_RE.search(transcript)
    if not m:
        return False, transcript
    remainder = (transcript[: m.start()] + " " + transcript[m.end():]).strip(" ,.!?")
    return True, remainder


def detect_sleep(transcript: str) -> bool:
    return bool(SLEEP_RE.search(transcript))
