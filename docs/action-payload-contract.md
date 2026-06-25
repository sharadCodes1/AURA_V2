# ActionPayload Contract (schema_version 1)

The single most important interface in AURA. `aura-ai` produces an `ActionPayload`;
`aura-fe` executes it. Both repos MUST agree on this shape.

- **Source of truth (Python):** [`aura-ai/app/schemas/action_payload.py`](../aura-ai/app/schemas/action_payload.py)
- **Mirror (TypeScript):** [`aura-fe/src/types/index.ts`](../aura-fe/src/types/index.ts)

If you change this contract, bump `schema_version` and update **both** files plus this doc.

## Shape

```jsonc
{
  "schema_version": 1,          // integer; bump on breaking changes
  "action": "open_app",         // see ActionType below
  "target": "chrome",           // primary argument (app name, text to type, scroll dir, …)
  "params": {},                 // action-specific extra args
  "confidence": 0.9,            // 0.0–1.0
  "spoken_response": "Opening chrome",  // what TTS says back
  "steps": null                 // only for run_macro: ordered ActionPayload[]
}
```

## ActionType enum

| `action` | Meaning | `target` | `params` |
|---|---|---|---|
| `open_app` | Launch an app | app name (canonical, e.g. `chrome`, `vscode`) | — |
| `close_app` | Quit an app | app name | — |
| `type_text` | Type text | the text to type | — |
| `click` | Mouse click | optional UI target text | — |
| `scroll` | Scroll | direction (`up`/`down`/`left`/`right`) | `{ "direction": "down" }` |
| `system_control` | OS control | control name (`volume`, `mute`, `brightness`, `lock`, `shutdown`, `restart`, `sleep`, `screenshot`) | e.g. `{ "control": "volume", "direction": "up" }` |
| `run_macro` | Run a saved macro | the trigger phrase | — (uses `steps`) |
| `unknown` | Couldn't resolve | `""` | — |

## run_macro

A macro expands into ordered child payloads in `steps`:

```jsonc
{
  "schema_version": 1,
  "action": "run_macro",
  "target": "work mode",
  "confidence": 1.0,
  "spoken_response": "Running work mode",
  "steps": [
    { "schema_version": 1, "action": "open_app", "target": "chrome",  "params": {}, "confidence": 0.0, "spoken_response": "", "steps": null },
    { "schema_version": 1, "action": "open_app", "target": "vscode",  "params": {}, "confidence": 0.0, "spoken_response": "", "steps": null }
  ]
}
```

The frontend executes `steps` in order. Child steps only need `action` + `target`;
other fields default.

## Transport

- **aura-ai → aura-fe**: over the `/ws/voice` WebSocket, wrapped as
  `{ "action_payload": { ... } }`. The same wrapper is returned by `POST /api/process-text`.
- **Storage**: `aura-be` persists the payload verbatim in `CommandLog.action_payload`
  (history) and as the steps array in `Macro.actions` — it never interprets the contents,
  so the contract can evolve without backend migrations.
