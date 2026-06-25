"""
Text-to-speech wrapper (pyttsx3, offline).

OPTIONAL dependency. If pyttsx3 isn't installed, synthesize() returns empty bytes
and the spoken_response text is still sent to the frontend (which can speak it with
the browser's SpeechSynthesis API instead).
"""
import logging
import tempfile
from typing import Optional

logger = logging.getLogger("aura.tts")


class TTSEngine:
    @property
    def available(self) -> bool:
        try:
            import pyttsx3  # noqa: F401
            return True
        except ImportError:
            return False

    def synthesize(self, text: str) -> bytes:
        """Render text to WAV audio bytes. Returns b'' if TTS is unavailable."""
        if not text or not self.available:
            return b""
        try:
            import pyttsx3
            engine = pyttsx3.init()
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                path = tmp.name
            engine.save_to_file(text, path)
            engine.runAndWait()
            with open(path, "rb") as fh:
                return fh.read()
        except Exception as exc:  # pragma: no cover - environment dependent
            logger.warning("TTS synthesis failed: %s", exc)
            return b""


tts_engine = TTSEngine()
