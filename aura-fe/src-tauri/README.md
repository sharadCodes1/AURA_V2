# src-tauri — native desktop / OS-control layer

The Rust backend that lets AURA actually control the machine (open apps, type, click,
scroll, system actions). Implemented with Tauri v2; the same Next.js UI runs inside it.

## Commands
A single Rust command, `execute_action`, in [`src/commands.rs`](./src/commands.rs) dispatches
on the AURA ActionPayload (see [docs/action-payload-contract.md](../../docs/action-payload-contract.md)):

| action | implementation (macOS) |
|---|---|
| `open_app` | `open -a <name>` (Win: `start`, Linux: `xdg-open`) |
| `close_app` | `osascript -e 'quit app "<name>"'` (Win: `taskkill`, Linux: `pkill`) |
| `type_text` | `enigo` keyboard text |
| `click` | `enigo` left click |
| `scroll` | `enigo` scroll (up/down/left/right) |
| `system_control` | `osascript` / `pmset` / `screencapture` (volume, mute, lock, sleep, shutdown, restart, brightness, screenshot) |

`run_macro` is expanded into its steps by the frontend before calling `execute_action`.

The frontend chooses native vs. stub automatically in
[`src/lib/executor.ts`](../src/lib/executor.ts): inside Tauri it `invoke()`s `execute_action`;
in a plain browser it logs the action (browsers can't control the OS).

## Run / build
```bash
# from aura-fe/
npm run tauri dev      # launches the desktop app (uses next dev server)
npm run tauri build    # produces a .app/.dmg (runs `TAURI_BUILD=1 npm run build` -> out/)
```
(Add `"tauri": "tauri"` to package.json scripts, or use `npx tauri dev` / `npx tauri build`.)

Static export: the Tauri bundle serves `aura-fe/out/`. `next.config.mjs` switches to
`output: "export"` only when `TAURI_BUILD=1` (set by `beforeBuildCommand`), so normal web
`next build`/`next start` is unaffected.

## macOS permissions
Simulating input and some system actions require granting the built app **Accessibility**
permission: System Settings → Privacy & Security → Accessibility. `open_app` and
`screenshot` work without it; `type_text`/`click`/`scroll` and key-code brightness need it.

## Verified
`cargo build` compiles the native layer cleanly (Tauri 2.11 + enigo 0.3) with the static
export embedded. Launching the GUI and granting Accessibility is a manual desktop step.
