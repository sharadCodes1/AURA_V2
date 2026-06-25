# aura-fe

The AURA frontend — auth, dashboard, mic control, command history, and a macro builder.
Next.js (App Router) + TypeScript + Tailwind. Designed to be wrapped in **Tauri** later
for native OS control; until then it runs as a normal web app and OS actions are stubbed.

This is one of three repos (see the [root README](../README.md)).

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- Zustand (auth state), Zod (form validation), Axios (REST client with JWT interceptor)
- Tauri — **deferred** (see [`src-tauri/README.md`](./src-tauri/README.md))

## Structure
```
src/
├── app/
│   ├── (auth)/login, (auth)/register   # auth pages
│   ├── dashboard/                       # protected: control, history, macros, settings
│   ├── layout.tsx, page.tsx, globals.css
├── components/
│   ├── auth/      LoginForm, RegisterForm
│   ├── dashboard/ MicButton, StatusIndicator, CommandFeed, DashboardShell
│   └── ui/        Button, Input
├── lib/
│   ├── api.ts        # axios + JWT attach + 401 refresh-once
│   ├── services.ts   # typed backend calls (auth, commands, macros)
│   ├── auth.ts       # refresh-token storage (localStorage in web; Tauri secure storage later)
│   ├── websocket.ts  # VoiceSocket — live audio stream to aura-ai
│   ├── executor.ts   # ActionPayload executor (STUB in web; Tauri invoke() later)
│   └── validators.ts # zod schemas
├── hooks/useRequireAuth.ts   # route guard + silent session refresh
├── store/authStore.ts        # zustand auth store (access token in memory)
└── types/index.ts            # shared types incl. ActionPayload (mirrors aura-ai)
```

## How auth works (frontend side)
1. **Register** → `POST /api/auth/register/` → redirect to login.
2. **Login** → `POST /api/auth/login/` → access token kept **in memory** (Zustand);
   refresh token in storage.
3. Axios attaches `Authorization: Bearer <access>` to every backend request.
4. On `401`, it refreshes **once** via `/api/auth/refresh/`, retries, else logs out.
5. The `/dashboard/*` routes are guarded by `useRequireAuth`, which silently re-hydrates
   the session from the refresh token on reload.
6. The dashboard opens a WebSocket to `aura-ai` (`?token=<access>`) for the voice stream.

## Voice flow
`MicButton` records audio → `VoiceSocket.sendAudio()` → `aura-ai` returns an
`ActionPayload` → `executeAction()` runs it (stubbed/logged in web) and `speak()` voices
the response. A text box on the control page sends typed commands over the same socket for
testing without a mic.

## Local setup
```bash
cp .env.example .env.local         # backend + AI ws URLs
npm install
npm run dev                        # http://localhost:3000
```
Requires `aura-be` on :8000 (auth/data) and `aura-ai` on :8001 (voice ws).

## Scripts
- `npm run dev` — dev server
- `npm run build` — production build (verified ✓)
- `npm run typecheck` — `tsc --noEmit`
- `npm run start` — serve the production build

## OS control / Tauri
A browser is sandboxed, so `executeAction` in [`src/lib/executor.ts`](./src/lib/executor.ts)
currently **logs** the action instead of performing it. To enable real control, wrap the app
in Tauri and replace the stub with `invoke()` calls into Rust commands —
see [`src-tauri/README.md`](./src-tauri/README.md). The full voice→intent→action flow is
testable today with the stub.
