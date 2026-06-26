// Action executor.
//
// - Inside the Tauri desktop shell: invoke the native `execute_action` Rust command,
//   which actually performs the OS action (open apps, type, click, scroll, system).
// - In a plain browser (web dev mode): browsers are sandboxed and cannot control the
//   OS, so we log what would happen.
//
// The Rust side lives in src-tauri/src/commands.rs and consumes the same ActionPayload
// fields (see docs/action-payload-contract.md).

import type { ActionPayload } from "@/types";

export interface ExecResult {
  ok: boolean;
  detail: string;
  /** true when running in the browser (no real OS control). */
  simulated: boolean;
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function executeAction(payload: ActionPayload): Promise<ExecResult> {
  if (payload.action === "unknown") {
    return { ok: false, detail: "no action", simulated: !isTauri() };
  }

  // Macros are expanded client-side into their ordered steps.
  if (payload.action === "run_macro" && payload.steps?.length) {
    const steps = payload.steps ?? [];
    const results = await Promise.all(steps.map((s) => executeAction(s)));
    const failed = results.filter((r) => !r.ok);
    return {
      ok: failed.length === 0,
      detail: failed.length ? `${failed.length}/${results.length} steps failed` : `${results.length} steps`,
      simulated: !isTauri(),
    };
  }

  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const detail = await invoke<string>("execute_action", {
        action: payload.action,
        target: payload.target,
        params: payload.params ?? {},
      });
      return { ok: true, detail, simulated: false };
    } catch (err) {
      return { ok: false, detail: String(err), simulated: false };
    }
  }

  // Web fallback: cannot control the OS from a sandboxed browser.
  // eslint-disable-next-line no-console
  console.log("[executor:stub]", payload.action, payload.target, payload.params);
  return { ok: true, detail: "simulated (run in the desktop app to actually execute)", simulated: true };
}

// Speak the assistant's response using the browser's built-in TTS.
export function speak(text: string): void {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}
