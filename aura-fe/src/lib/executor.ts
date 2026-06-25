// Action executor.
//
// In the browser (web mode) we CANNOT control the OS — so this is a STUB that logs
// what would happen. When the app is wrapped in Tauri for the desktop build, replace
// the body of `executeAction` with calls into Tauri Rust commands, e.g.:
//
//   import { invoke } from "@tauri-apps/api/core";
//   await invoke("open_app", { name: payload.target });
//
// The Rust side (src-tauri/src/commands/*) uses a crate like `enigo` for mouse/keyboard
// and shell calls for launching apps. See src-tauri/README.md for the plan.

import type { ActionPayload } from "@/types";

export async function executeAction(payload: ActionPayload): Promise<void> {
  if (payload.action === "run_macro" && payload.steps?.length) {
    for (const step of payload.steps) {
      await executeAction(step);
    }
    return;
  }

  // STUB: browser cannot perform OS actions. Log instead.
  // eslint-disable-next-line no-console
  console.log("[executor:stub]", payload.action, payload.target, payload.params);
}

// Speak the assistant's response using the browser's built-in TTS (works without aura-ai TTS).
export function speak(text: string): void {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}
