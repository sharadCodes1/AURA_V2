// Manages the WebSocket connection to aura-ai for the live voice stream.
//
// Usage:
//   const sock = new VoiceSocket(accessToken, {
//     onAction: (payload) => { ... },
//     onStatusChange: (s) => { ... },
//   });
//   sock.connect();
//   sock.sendAudio(blob);   // or sock.sendText("open chrome") for debugging
//   sock.disconnect();

import type { ActionPayload } from "@/types";

const WS_URL =
  process.env.NEXT_PUBLIC_AI_SERVICE_WS_URL || "ws://localhost:8001/ws/voice";

export type SocketStatus = "idle" | "connecting" | "open" | "closed" | "error";

export interface VoiceResult {
  transcript: string;
  action_payload: ActionPayload;
  status: "success" | "failed" | "ambiguous";
}

interface VoiceSocketHandlers {
  onResult?: (result: VoiceResult) => void;
  onStatusChange?: (status: SocketStatus) => void;
}

export class VoiceSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private handlers: VoiceSocketHandlers;

  constructor(token: string, handlers: VoiceSocketHandlers = {}) {
    this.token = token;
    this.handlers = handlers;
  }

  private setStatus(status: SocketStatus) {
    this.handlers.onStatusChange?.(status);
  }

  connect(): void {
    if (this.ws) return;
    this.setStatus("connecting");
    const url = `${WS_URL}?token=${encodeURIComponent(this.token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => this.setStatus("open");
    ws.onerror = () => this.setStatus("error");
    ws.onclose = () => {
      this.ws = null;
      this.setStatus("closed");
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action_payload) {
          this.handlers.onResult?.({
            transcript: data.transcript ?? "",
            action_payload: data.action_payload as ActionPayload,
            status: data.status ?? "ambiguous",
          });
        }
      } catch {
        // ignore non-JSON frames
      }
    };
  }

  sendAudio(audio: Blob | ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(audio);
    }
  }

  sendText(text: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(text);
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
