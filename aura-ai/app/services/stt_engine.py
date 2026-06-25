"""
Speech-to-text wrapper around faster-whisper.

faster-whisper is an OPTIONAL dependency (see requirements-audio.txt). If it isn't
installed, the engine reports unavailable and the graph's stt_node falls back to
any text already present in the state (so /api/process-text still works end-to-end).
"""
import io
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger("aura.stt")


class STTEngine:
    def __init__(self, model_size: Optional[str] = None):
        self.model_size = model_size or settings.whisper_model_size
        self._model = None  # lazily loaded on first use

    @property
    def available(self) -> bool:
        try:
            import faster_whisper  # noqa: F401
            return True
        except ImportError:
            return False

    def _load(self):
        if self._model is None:
            from faster_whisper import WhisperModel
            logger.info("Loading faster-whisper model '%s'...", self.model_size)
            self._model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
        return self._model

    def transcribe(self, audio_bytes: bytes) -> str:
        """
        Transcribe a complete audio blob to text.

        Accepts any container faster-whisper can decode (WAV, webm/opus from the
        browser MediaRecorder, mp3, etc.) — it decodes by content via PyAV, so the
        format/extension doesn't matter. Returns "" if STT is unavailable or empty.
        """
        if not self.available:
            logger.warning("faster-whisper not installed; cannot transcribe audio.")
            return ""
        if not audio_bytes:
            return ""
        model = self._load()
        segments, _info = model.transcribe(io.BytesIO(audio_bytes), beam_size=5)
        return " ".join(seg.text for seg in segments).strip()


stt_engine = STTEngine()
