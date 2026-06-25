# src-tauri (deferred — desktop OS-control layer)

Per the build plan, Tauri is added **last**, after the web app and AI pipeline both work
end-to-end. This folder is a placeholder describing the plan; there is no Rust code yet.

## Why Tauri
A browser cannot control the OS (open apps, move the mouse, type). Wrapping this Next.js
app in Tauri gives it a Rust backend with native access, while the UI stays the same.

## What to add when you're ready
1. Install the Tauri CLI and init:
   ```bash
   npm install -D @tauri-apps/cli
   npm install @tauri-apps/api
   npx tauri init        # point it at the Next.js build (output: "export" -> out/)
   ```
2. In `next.config.mjs`, set `output: "export"` so Tauri can serve static files.
3. Implement Rust commands under `src-tauri/src/commands/`:
   - `app_launcher.rs` — open/close apps by name (shell out or platform APIs)
   - `mouse_control.rs` / `keyboard_control.rs` — use the [`enigo`](https://crates.io/crates/enigo) crate
4. Replace the stub in [`src/lib/executor.ts`](../src/lib/executor.ts) with `invoke()` calls:
   ```ts
   import { invoke } from "@tauri-apps/api/core";
   await invoke("open_app", { name: payload.target });
   ```

## Contract
The Rust command layer consumes the same **ActionPayload** the frontend already receives
from `aura-ai` (see [docs/action-payload-contract.md](../../docs/action-payload-contract.md)).
Until then, `executeAction` logs actions to the console so the full flow is testable.
