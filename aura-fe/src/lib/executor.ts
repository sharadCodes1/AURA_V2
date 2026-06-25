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

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function executeAction(payload: ActionPayload): Promise<void> {
  // Macros are expanded client-side into their ordered steps.
  if (payload.action === "run_macro" && payload.steps?.length) {
    for (const step of payload.steps) {
      await executeAction(step);
    }
    return;
  }

  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<string>("execute_action", {
        action: payload.action,
        target: payload.target,
        params: payload.params ?? {},
      });
      // eslint-disable-next-line no-console
      console.log("[executor:tauri]", result);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[executor:tauri] failed", err);
    }
    return;
  }

  // Web fallback: cannot control the OS from a sandboxed browser.
  // eslint-disable-next-line no-console
  console.log("[executor:stub]", payload.action, payload.target, payload.params);
}

// Speak the assistant's response using the browser's built-in TTS.
export function speak(text: string): void {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}
