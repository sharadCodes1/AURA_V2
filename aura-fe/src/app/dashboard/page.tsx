"use client";

import { useEffect, useRef, useState } from "react";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { CommandFeed } from "@/components/dashboard/CommandFeed";
import { ConversationOrb, type OrbState } from "@/components/dashboard/ConversationOrb";
import { Button } from "@/components/ui/Button";
import { VoiceSocket, type SocketStatus, type VoiceResult } from "@/lib/websocket";
import { ConversationController, type ConvState } from "@/lib/conversation";
import { executeAction, speak, isTauri } from "@/lib/executor";
import { useAuthStore } from "@/store/authStore";
import type { FeedItem } from "@/types";

let feedCounter = 0;
const nextId = () => `${Date.now()}-${feedCounter++}`;

export default function ControlPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [text, setText] = useState("");

  // conversation state
  const [convActive, setConvActive] = useState(false);
  const [convState, setConvState] = useState<ConvState>("idle");
  const [thinking, setThinking] = useState(false);
  const [awake, setAwake] = useState(false);
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");

  const socketRef = useRef<VoiceSocket | null>(null);
  const convRef = useRef<ConversationController | null>(null);

  // --- socket lifecycle ---
  useEffect(() => {
    if (!accessToken) return;
    const socket = new VoiceSocket(accessToken, {
      onStatusChange: setStatus,
      onResult: async (result: VoiceResult) => {
        setThinking(false);
        setAwake(Boolean(result.awake));

        // Asleep: ambient speech ignored — stay quiet.
        if (result.kind === "asleep") return;

        const spoken = result.spoken_response || result.action_payload.spoken_response;
        if (result.transcript) setHeard(result.transcript);
        if (spoken) {
          setReply(spoken);
          speak(spoken); // active talk-back
        }

        if (result.kind === "command") {
          const exec = await executeAction(result.action_payload);
          setFeed((prev) =>
            [
              {
                id: nextId(),
                transcript: result.transcript,
                payload: result.action_payload,
                resolution: result.status === "asleep" ? "ambiguous" : result.status,
                execOk: exec.ok,
                execDetail: exec.detail,
                simulated: exec.simulated,
                at: Date.now(),
              },
              ...prev,
            ].slice(0, 50)
          );
        }
      },
    });
    socket.connect();
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  // --- conversation (VAD) lifecycle ---
  function startConversation() {
    if (convRef.current) return;
    const controller = new ConversationController({
      onState: setConvState,
      onLevel: setLevel,
      shouldPause: () => Boolean(typeof window !== "undefined" && window.speechSynthesis?.speaking),
      onUtterance: (blob) => {
        setThinking(true);
        socketRef.current?.sendAudio(blob);
      },
    });
    controller
      .start()
      .then(() => {
        convRef.current = controller;
        setConvActive(true);
      })
      .catch(() => {
        setConvActive(false);
        setReply("Microphone access denied. Enable it in System Settings → Privacy → Microphone.");
      });
  }

  function stopConversation() {
    convRef.current?.stop();
    convRef.current = null;
    setConvActive(false);
    setAwake(false);
    setConvState("idle");
    window.speechSynthesis?.cancel();
  }

  // stop on unmount (closing the app)
  useEffect(() => () => convRef.current?.stop(), []);

  function sendText(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setThinking(true);
    setHeard(value);
    socketRef.current?.sendText(value);
    setText("");
  }

  const connected = status === "open";
  const orbState: OrbState = thinking ? "thinking" : convState;

  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Voice control</h1>
          <p className="text-sm text-zinc-500">
            Hands-free — say <span className="text-zinc-300">“Hi Aura”</span>, then talk.
          </p>
        </div>
        <StatusIndicator status={status} />
      </header>

      {!isTauri() && (
        <div className="mb-4 text-xs text-zinc-400 bg-surface2 border border-line rounded-lg px-3 py-2">
          Running in the browser — commands are <strong>simulated</strong> (logged, not executed).
          Launch the AURA desktop app to control your machine for real.
        </div>
      )}

      <div className="card p-8 flex flex-col items-center gap-6">
        <ConversationOrb active={convActive} awake={awake} state={orbState} level={level} />

        {!convActive ? (
          <Button onClick={startConversation} disabled={!connected}>
            Start conversation
          </Button>
        ) : (
          <Button variant="ghost" onClick={stopConversation}>
            Stop conversation
          </Button>
        )}

        <div className="w-full grid gap-2 text-center min-h-[3rem]">
          {heard && (
            <p className="text-zinc-300">
              <span className="text-zinc-600 text-xs uppercase tracking-wide mr-2">You</span>
              “{heard}”
            </p>
          )}
          {reply && (
            <p className="text-accent">
              <span className="text-zinc-600 text-xs uppercase tracking-wide mr-2">Aura</span>
              {reply}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={sendText} className="mt-4 flex gap-2">
        <input
          className="field font-mono"
          placeholder='Or type a command — e.g. "open chrome"'
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
