"use client";

import { useEffect, useRef, useState } from "react";
import { MicButton } from "@/components/dashboard/MicButton";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { CommandFeed } from "@/components/dashboard/CommandFeed";
import { TranscriptPanel } from "@/components/dashboard/TranscriptPanel";
import { Button } from "@/components/ui/Button";
import { VoiceSocket, type SocketStatus, type VoiceResult } from "@/lib/websocket";
import { executeAction, speak, isTauri } from "@/lib/executor";
import { useAuthStore } from "@/store/authStore";
import type { ActionPayload, FeedItem } from "@/types";

let feedCounter = 0;
const nextId = () => `${Date.now()}-${feedCounter++}`;

export default function ControlPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [current, setCurrent] = useState<{ transcript: string; payload?: ActionPayload }>({
    transcript: "",
  });
  const socketRef = useRef<VoiceSocket | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    const socket = new VoiceSocket(accessToken, {
      onStatusChange: setStatus,
      onResult: async (result: VoiceResult) => {
        setPending(false);
        const payload = result.action_payload;
        setCurrent({ transcript: result.transcript, payload });
        speak(payload.spoken_response);

        const exec = await executeAction(payload);
        setFeed((prev) =>
          [
            {
              id: nextId(),
              transcript: result.transcript,
              payload,
              resolution: result.status,
              execOk: exec.ok,
              execDetail: exec.detail,
              simulated: exec.simulated,
              at: Date.now(),
            },
            ...prev,
          ].slice(0, 50)
        );
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
    setPending(true);
    setCurrent({ transcript: "" });
    socketRef.current?.sendAudio(blob);
  }

  function sendText(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setPending(true);
    socketRef.current?.sendText(value);
    setText("");
  }

  const connected = status === "open";

  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Voice control</h1>
          <p className="text-sm text-zinc-500">Speak or type a command.</p>
        </div>
        <StatusIndicator status={status} />
      </header>

      {!isTauri() && (
        <div className="mb-4 text-xs text-zinc-400 bg-surface2 border border-line rounded-lg px-3 py-2">
          Running in the browser — commands are <strong>simulated</strong> (logged, not executed).
          Launch the AURA desktop app to control your machine for real.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 items-stretch">
        <div className="card flex items-center justify-center px-8 py-6">
          <MicButton disabled={!connected} onAudio={handleAudio} />
        </div>
        <TranscriptPanel transcript={current.transcript} payload={current.payload} pending={pending} />
      </div>

      <form onSubmit={sendText} className="mt-4 flex gap-2">
        <input
          className="field font-mono"
          placeholder='Type a command — e.g. "open chrome"'
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!connected}
        />
        <Button type="submit" disabled={!connected || !text.trim()}>
          Send
        </Button>
      </form>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Recent</h2>
        <CommandFeed items={feed} />
      </div>
    </div>
  );
}
