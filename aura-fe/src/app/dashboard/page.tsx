"use client";

import { useEffect, useRef, useState } from "react";
import { MicButton } from "@/components/dashboard/MicButton";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { CommandFeed } from "@/components/dashboard/CommandFeed";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VoiceSocket, type SocketStatus } from "@/lib/websocket";
import { executeAction, speak } from "@/lib/executor";
import { useAuthStore } from "@/store/authStore";
import type { ActionPayload, FeedItem } from "@/types";

let feedCounter = 0;
const nextId = () => `${Date.now()}-${feedCounter++}`;

export default function ControlPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [text, setText] = useState("");
  const socketRef = useRef<VoiceSocket | null>(null);
  const pendingTranscript = useRef<string>("");

  useEffect(() => {
    if (!accessToken) return;
    const socket = new VoiceSocket(accessToken, {
      onStatusChange: setStatus,
      onAction: (payload: ActionPayload) => {
        const ok = payload.action !== "unknown";
        setFeed((prev) => [
          {
            id: nextId(),
            transcript: pendingTranscript.current,
            payload,
            status: ok ? "executed" : "failed",
            at: Date.now(),
          },
          ...prev,
        ]);
        pendingTranscript.current = "";
        if (ok) void executeAction(payload);
        speak(payload.spoken_response);
      },
    });
    socket.connect();
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  function handleAudio(blob: Blob) {
    pendingTranscript.current = "";
    socketRef.current?.sendAudio(blob);
  }

  function sendText(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    pendingTranscript.current = value;
    socketRef.current?.sendText(value);
    setText("");
  }

  const connected = status === "open";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Control</h2>
        <StatusIndicator status={status} />
      </div>

      <div className="bg-aura-panel rounded-2xl border border-slate-800 p-8 flex flex-col items-center gap-6">
        <MicButton disabled={!connected} onAudio={handleAudio} />

        <form onSubmit={sendText} className="w-full flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Or type a command (debug)"
              name="command"
              placeholder="e.g. open chrome"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={!connected}>
            Send
          </Button>
        </form>
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-3">Live feed</h3>
      <CommandFeed items={feed} />
    </div>
  );
}
