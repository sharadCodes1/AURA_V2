# aura-ai

The voice/intent **brain** of AURA. A FastAPI service wrapping a **LangGraph** pipeline:

```
STT → macro lookup → intent → resolver → TTS
```

It takes voice (or typed text), figures out what the user wants, and emits an
**ActionPayload** — the executable instruction that `aura-fe` runs on the user's machine.

This is one of three repos (see the [root README](../README.md)).

## Stack
- FastAPI + Uvicorn (REST + WebSocket)
- LangGraph (stateful graph of nodes)
- PyJWT (validates user tokens issued by `aura-be`)
- httpx (service-to-service calls to `aura-be`)
- **Optional:** faster-whisper (STT), pyttsx3 (TTS) — see `requirements-audio.txt`

> The core service runs and the **text pipeline works without any audio dependencies**.
> Install audio deps only when you want real speech in/out.

## Pipeline (LangGraph)

```
START → stt → macro_lookup ─┬─(is_macro)──────────────→ resolver → tts → END
                            └─(not macro)→ classify_intent → resolver → tts → END
```

| Node | Does |
|---|---|
| `stt` | audio bytes → transcript (faster-whisper). No-op if transcript already set (text input). |
| `macro_lookup` | matches the transcript against the user's saved macros (pre-loaded from `aura-be`). |
| `classify_intent` | rule-based (regex) transcript → intent + entities. |
| `resolver` | intent **or** matched macro → concrete `ActionPayload` + spoken response. |
| `tts` | spoken response → audio (pyttsx3). Empty if TTS not installed; frontend speaks the text. |

> Node is named `classify_intent` (not `intent`) because LangGraph forbids a node name
> that collides with a state key (`intent` is a state field).

## The shared contract: ActionPayload
Defined in [`app/schemas/action_payload.py`](./app/schemas/action_payload.py) and documented at
[`docs/action-payload-contract.md`](../docs/action-payload-contract.md). Example:

```json
{
  "schema_version": 1,
  "action": "open_app",
  "target": "chrome",
  "params": {},
  "confidence": 0.9,
  "spoken_response": "Opening chrome",
  "steps": null
}
```

`action` is one of: `open_app`, `close_app`, `type_text`, `click`, `scroll`,
`system_control`, `run_macro`, `unknown`. A `run_macro` payload carries an ordered
`steps` array of child payloads.

## API

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/health` | Health + which audio engines are available | Public |
| POST | `/api/process-text` | **Text-input fallback** — run the pipeline on typed text | Optional user JWT |
| WS | `/ws/voice?token=<JWT>` | Live audio stream → action payloads | User JWT (query param) |

- `/api/process-text` body: `{"text": "...", "token": "<user JWT, optional>"}`.
  With a token, the user's macros are loaded and the command is logged to `aura-be`.
  Without one, it just resolves the action (great for quick testing).
- `/ws/voice`: validates the JWT on connect, loads the user's macros once, then for each
  message (binary audio or text) runs the pipeline and sends back `{"action_payload": {...}}`.

## Auth model
- **User tokens**: verified **locally** with the shared signing key (`JWT_SECRET_KEY`, must
  equal `aura-be`'s Django `SECRET_KEY`; HS256). If `JWT_SECRET_KEY` is empty, it falls back
  to calling `aura-be`'s `/api/auth/verify-service/`.
- **Backend calls** (macros, command logging): authed with the shared `AI_SERVICE_TOKEN`
  in the `X-Service-Token` header (must match `aura-be`'s value).

## Local setup
```bash
cp .env.example .env          # ensure JWT_SECRET_KEY == aura-be SECRET_KEY, tokens match
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt              # core only
# .venv/bin/pip install -r requirements-audio.txt      # optional: real STT/TTS

.venv/bin/python -m uvicorn app.main:app --port 8001 --reload
```

### Quick test (no mic, no backend needed)
```bash
curl -s localhost:8001/api/process-text -H 'Content-Type: application/json' \
  -d '{"text":"open chrome"}' | python3 -m json.tool
```

### Full test (with backend + a real user)
Run `aura-be` on :8000, log in to get a JWT, then:
```bash
curl -s localhost:8001/api/process-text -H 'Content-Type: application/json' \
  -d '{"text":"work mode","token":"<ACCESS_JWT>"}'
```

## Extending intent recognition
`classify_intent` is deliberately rule-based (fast, offline, free). When free-form
language coverage matters, add an LLM fallback inside `app/graph/nodes/intent_node.py`
(use `LLM_API_KEY`) — the rest of the graph is unaffected because everything downstream
consumes the same `intent` + `entities` shape.
