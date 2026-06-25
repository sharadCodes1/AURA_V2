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
- ✅ `aura-be` — implemented (auth, commands, macros, service auth). See [aura-be/README.md](./aura-be/README.md).
- ⬜ `aura-fe` — not started.
- ⬜ `aura-ai` — not started.

## Build order
Backend → Frontend (browser mode) → AI service (text-input testing) → wire WebSocket → wrap in Tauri last.
See the architecture spec for the full rationale.
