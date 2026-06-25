"""
FastAPI entrypoint for aura-ai.

Endpoints:
  GET  /health             health check
  POST /api/process-text   text-input fallback — run the pipeline on typed text
  WS   /ws/voice           live audio stream -> action payloads

The WebSocket authenticates the user JWT (passed as ?token=) up front, fetches the
user's macros once, then for each incoming message runs the LangGraph pipeline and
streams back an ActionPayload. Every resolved command is logged to the backend.
"""
import logging
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.auth.jwt_validator import validate_token
from app.config import settings
from app.graph.graph_builder import get_compiled_graph
from app.schemas.action_payload import unknown_action
from app.services.backend_client import backend_client
from app.services.stt_engine import stt_engine
from app.services.tts_engine import tts_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aura.main")

app = FastAPI(title="aura-ai", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = get_compiled_graph()


# --------------------------------------------------------------------------- #
# Core pipeline runner
# --------------------------------------------------------------------------- #
async def run_pipeline(
    user_id: Optional[int],
    transcript: str = "",
    audio_chunk: bytes = b"",
    macros: Optional[list] = None,
    log: bool = True,
) -> dict:
    """Run the graph once and (optionally) log the result. Returns the action payload."""
    state = {
        "user_id": user_id or 0,
        "transcript": transcript,
        "audio_chunk": audio_chunk,
        "macros": macros if macros is not None else [],
    }
    result = await graph.ainvoke(state)

    payload = result.get("action_payload") or unknown_action().model_dump()
    if log and user_id:
        await backend_client.log_command(
            user_id=user_id,
            raw_transcript=result.get("transcript", transcript),
            resolved_intent=payload.get("action", "unknown"),
            action_payload=payload,
            status=result.get("status", "ambiguous"),
        )
    return payload


# --------------------------------------------------------------------------- #
# REST
# --------------------------------------------------------------------------- #
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "aura-ai",
        "stt_available": stt_engine.available,
        "tts_available": tts_engine.available,
    }


class ProcessTextRequest(BaseModel):
    text: str
    token: Optional[str] = None   # user JWT; if omitted, runs without logging
    user_id: Optional[int] = None


@app.post("/api/process-text")
async def process_text(req: ProcessTextRequest):
    """Fallback for testing without a mic: process typed text through the pipeline."""
    user_id = req.user_id
    macros = []
    if req.token:
        resolved = await validate_token(req.token)
        if resolved is not None:
            user_id = resolved
    if user_id:
        macros = await backend_client.get_user_macros(user_id)

    payload = await run_pipeline(
        user_id=user_id, transcript=req.text, macros=macros, log=bool(user_id)
    )
    return {"action_payload": payload}


# --------------------------------------------------------------------------- #
# WebSocket
# --------------------------------------------------------------------------- #
@app.websocket("/ws/voice")
async def ws_voice(websocket: WebSocket):
    token = websocket.query_params.get("token", "")
    user_id = await validate_token(token)
    if user_id is None:
        await websocket.close(code=4401)  # unauthorized
        return

    await websocket.accept()
    macros = await backend_client.get_user_macros(user_id)
    logger.info("WS connected: user=%s, macros=%d", user_id, len(macros))

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"] is not None:
                payload = await run_pipeline(
                    user_id=user_id, audio_chunk=message["bytes"], macros=macros
                )
            elif "text" in message and message["text"] is not None:
                # Allow typed text over the same socket (handy for debugging).
                payload = await run_pipeline(
                    user_id=user_id, transcript=message["text"], macros=macros
                )
            else:
                continue

            await websocket.send_json({"action_payload": payload})
    except WebSocketDisconnect:
        logger.info("WS disconnected: user=%s", user_id)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
