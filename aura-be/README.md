# aura-be

Backend for the **AURA** voice-controlled HCI system — the single source of truth and auth gatekeeper.
Django + DRF + PostgreSQL, JWT auth, and a shared-token service API for the AI service (`aura-ai`).

This is one of three repos:

| Repo | Role |
|---|---|
| `aura-fe` | Next.js + Tauri desktop frontend (auth, dashboard, OS control) |
| **`aura-be`** | **Django backend — auth, command logs, macros (this repo)** |
| `aura-ai` | FastAPI + LangGraph voice pipeline (STT → intent → action → TTS) |

## Stack
- Django 4.2 LTS (pinned for Python 3.9 compatibility) + Django REST Framework
- PostgreSQL 16
- `djangorestframework-simplejwt` (email-based JWT auth)
- `django-cors-headers`, `django-environ`

## Project layout
```
config/settings/{base,dev,prod}.py   # split settings, env-driven
apps/users/                          # CustomUser (email login), register/login/me/verify-service
apps/commands/                       # CommandLog model + history API
apps/macros/                         # user-defined macro chains
apps/service_auth/                   # ServiceToken model + IsAIService permission
```

## Local setup
```bash
# 1. Postgres (Homebrew) must be running; create role + db once:
psql -d postgres -c "CREATE ROLE aura LOGIN PASSWORD 'aura';"
psql -d postgres -c "CREATE DATABASE aura OWNER aura;"

# 2. Env + deps
cp .env.example .env            # then edit SECRET_KEY / AI_SERVICE_TOKEN
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# 3. Migrate + run
.venv/bin/python manage.py migrate
.venv/bin/python manage.py createsuperuser   # optional, for /admin
.venv/bin/python manage.py runserver 127.0.0.1:8000
```

## API

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/health/` | Health check | Public |
| POST | `/api/auth/register/` | Create account | Public |
| POST | `/api/auth/login/` | Get `{access, refresh, user}` | Public |
| POST | `/api/auth/refresh/` | Refresh access token | Refresh token |
| GET | `/api/auth/me/` | Current user profile | User JWT |
| POST | `/api/auth/verify-service/` | AI service validates a user JWT | Service token |
| GET/POST | `/api/commands/` | List / create command logs | User JWT **or** service token |
| GET/POST | `/api/macros/` | List / create macros | User JWT (read: also service token via `?user_id=`) |
| GET/PUT/PATCH/DELETE | `/api/macros/<id>/` | Macro detail | User JWT |

### Auth model
- **End users** authenticate with email + password → JWT pair (access 30 min, refresh 7 days, rotating).
- **The AI service** authenticates service-to-service with a shared secret in the `X-Service-Token`
  header (`settings.AI_SERVICE_TOKEN`, must match `aura-ai`'s `.env`). Optionally, additional
  per-service tokens can be issued via the `ServiceToken` model in `/admin`.

### Quick smoke test
```bash
curl -X POST localhost:8000/api/auth/register/ -H 'Content-Type: application/json' \
  -d '{"email":"demo@aura.dev","password":"SuperSecret123","confirm_password":"SuperSecret123"}'
curl -X POST localhost:8000/api/auth/login/ -H 'Content-Type: application/json' \
  -d '{"email":"demo@aura.dev","password":"SuperSecret123"}'
```

## Cross-repo contracts
- **Service token**: `AI_SERVICE_TOKEN` must be identical in `aura-be/.env` and `aura-ai/.env`.
- **JWT validation**: `aura-ai` can either call `POST /api/auth/verify-service/` per connection, or
  verify locally with the shared `SECRET_KEY` (HS256) — the latter avoids a round trip.
- **Action payload schema** is owned by `aura-ai`; this backend stores it verbatim in
  `CommandLog.action_payload` / `Macro.actions` (JSON), so it stays forward-compatible.
