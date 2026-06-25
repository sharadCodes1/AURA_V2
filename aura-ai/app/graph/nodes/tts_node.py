"""TTS node: synthesize the spoken response to audio (optional).

If pyttsx3 isn't installed, response_audio stays empty and the frontend speaks the
response_text itself (e.g. with the browser SpeechSynthesis API).
"""
from app.graph.state import VoiceState
from app.services.tts_engine import tts_engine


def tts_node(state: VoiceState) -> VoiceState:
    text = state.get("response_text", "")
    audio = tts_engine.synthesize(text) if text else b""
    return {"response_audio": audio}
