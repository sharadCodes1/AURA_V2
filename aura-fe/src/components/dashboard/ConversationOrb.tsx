"use client";

import type { ConvState } from "@/lib/conversation";

export type OrbState = ConvState | "thinking";

interface Props {
  active: boolean; // conversation running
  awake: boolean; // woken by "Hi Aura"
  state: OrbState;
  level: number; // 0..1
}

const statusText: Record<OrbState, string> = {
  idle: "Conversation off",
  listening: "Listening…",
  capturing: "Hearing you…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

export function ConversationOrb({ active, awake, state, level }: Props) {
  const scale = state === "capturing" ? 1 + level * 0.7 : state === "speaking" ? 1.15 : 1;

  // Color: dim when off, amber when awake-but-idle-listening, teal when engaged.
  const ringColor = !active
    ? "border-line"
    : awake
    ? "border-accent"
    : "border-amber-400/70";

  const glow = active && (state === "capturing" || state === "speaking");

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="relative h-40 w-40 flex items-center justify-center">
        <span
          className="absolute rounded-full transition-transform duration-75"
          style={{
            height: "100%",
            width: "100%",
            transform: `scale(${scale})`,
            background: glow
              ? "radial-gradient(circle, rgba(45,212,191,0.18), transparent 70%)"
              : "transparent",
          }}
        />
        <span className={`absolute inset-2 rounded-full border-2 ${ringColor}`} />
        <span
          className={`absolute inset-6 rounded-full border ${
            active ? "border-accent/30" : "border-line/60"
          } ${state === "listening" && awake ? "animate-pulse" : ""}`}
        />
        <div className="relative text-center">
          <div className={`text-xs uppercase tracking-widest ${awake ? "text-accent" : "text-zinc-500"}`}>
            {!active ? "Off" : awake ? "Awake" : "Asleep"}
          </div>
        </div>
      </div>

      <p className="text-sm text-zinc-300 h-5">{active ? statusText[state] : ""}</p>

      {active && !awake && (
        <p className="text-xs text-zinc-500">
          Say <span className="text-zinc-200 font-medium">“Hi Aura”</span> to wake me
        </p>
      )}
    </div>
  );
}
