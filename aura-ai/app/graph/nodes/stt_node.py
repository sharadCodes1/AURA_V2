"""STT node: turn an audio chunk into a transcript.

If a transcript is already present (text-input path via /api/process-text), this is
a no-op. If audio is present and faster-whisper is installed, it transcribes;
otherwise it leaves the transcript empty.
"""
import logging

from app.graph.state import VoiceState
from app.services.stt_engine import stt_engine

logger = logging.getLogger("aura.node.stt")


def stt_node(state: VoiceState) -> VoiceState:
    if state.get("transcript"):
        return {"transcript": state["transcript"].strip()}

    audio = state.get("audio_chunk") or b""
    if not audio:
        return {"transcript": ""}

    transcript = stt_engine.transcribe(audio)
    logger.info("STT transcript: %r", transcript)
    return {"transcript": transcript}
