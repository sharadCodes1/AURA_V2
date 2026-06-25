# AURA — Voice-Controlled HCI System

A voice-driven human-computer interaction system. Speak a command; AURA transcribes it,
resolves intent, and executes an OS action (open apps, type, click, run macros).

This is a **monorepo** containing three services:

| Folder | Service | Stack | Role |
|---|---|---|---|
| [`aura-be/`](./aura-be) | Backend | Django + DRF + PostgreSQL | Auth gatekeeper, command logs, macros — single source of truth |
| [`aura-fe/`](./aura-fe) | Frontend | Next.js + TypeScript + Tauri | Auth, dashboard, mic UI, native OS control |
| [`aura-ai/`](./aura-ai) | AI service | FastAPI + LangGraph | STT → intent → action resolver → TTS pipeline |

## Architecture

```
  aura-fe  ──REST (user JWT)──►  aura-be  ◄──REST (service token)──  aura-ai
     │                                                                  ▲
     └──────────────── WebSocket (live audio stream) ──────────────────┘
```

- **Frontend ↔ Backend**: all sensitive/persistent data (auth, history, macros) over REST with a user JWT.
- **Frontend ↔ AI service**: only the live audio stream, over WebSocket (avoids routing raw audio through Django).
- **AI service ↔ Backend**: service-to-service calls (validate JWTs, log commands, read macros) authed by a shared `X-Service-Token`.

## Status
- ✅ `aura-be` — implemented & verified (auth, commands, macros, service auth). See [aura-be/README.md](./aura-be/README.md).
- ✅ `aura-ai` — implemented & verified (LangGraph pipeline, text + ws endpoints, JWT, logging). See [aura-ai/README.md](./aura-ai/README.md).
- ✅ `aura-fe` — scaffolded & builds (auth, dashboard, mic, macros). Native OS control (Tauri) deferred. See [aura-fe/README.md](./aura-fe/README.md).

All three were verified end-to-end together: register/login on the frontend → backend issues a JWT →
aura-ai validates it locally, matches macros, resolves intents, and logs commands back to the backend.

## Shared contract
The **ActionPayload** that aura-ai emits and aura-fe executes is documented once at
[docs/action-payload-contract.md](./docs/action-payload-contract.md).

## Build order
Backend → Frontend (browser mode) → AI service (text-input testing) → wire WebSocket → wrap in Tauri last.
See the architecture spec for the full rationale.
