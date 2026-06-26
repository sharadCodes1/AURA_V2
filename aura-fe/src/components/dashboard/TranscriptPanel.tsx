import type { ActionPayload } from "@/types";

interface Props {
  transcript: string;
  payload?: ActionPayload;
  pending: boolean;
}

/**
 * The "what I heard" panel — writes out the latest transcription from the mic and
 * the action it resolved to. This is the primary feedback that voice is working.
 */
export function TranscriptPanel({ transcript, payload, pending }: Props) {
  return (
    <div className="card p-6 min-h-[140px] flex flex-col justify-center">
      <span className="label mb-2">Heard</span>
      {pending ? (
        <span className="text-zinc-500 text-lg animate-pulse font-mono">transcribing…</span>
      ) : transcript ? (
        <p className="text-2xl font-medium leading-snug text-zinc-50">“{transcript}”</p>
      ) : (
        <p className="text-lg text-zinc-600">Say something, or type a command below.</p>
      )}

      {payload && payload.action !== "unknown" && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="font-mono text-accent">{payload.action}</span>
          {payload.target && <span className="text-zinc-400">· {payload.target}</span>}
          {payload.spoken_response && (
            <span className="text-zinc-500 ml-auto italic">“{payload.spoken_response}”</span>
          )}
        </div>
      )}
      {payload && payload.action === "unknown" && transcript && (
        <div className="mt-4 text-sm text-amber-400/90">
          Didn’t match a command — try “open chrome”, “type hello”, or “scroll down”.
        </div>
      )}
    </div>
  );
}
