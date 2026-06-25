"use client";

import { useRef, useState } from "react";

interface Props {
  disabled?: boolean;
  onAudio: (audio: Blob) => void;
}

/**
 * Press-to-record mic button. Captures audio with MediaRecorder and hands the
 * recorded blob to `onAudio` (which the dashboard streams to aura-ai over WS).
 * Shows a simple pulsing "listening" ring while recording.
 */
export function MicButton({ disabled, onAudio }: Props) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onAudio(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Microphone access denied.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={recording ? stop : start}
        className={`relative h-24 w-24 rounded-full flex items-center justify-center text-3xl transition
          ${recording ? "bg-red-600" : "bg-aura-accent hover:bg-indigo-500"}
          disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label={recording ? "Stop recording" : "Start recording"}
      >
        {recording && (
          <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
        )}
        🎙️
      </button>
      <span className="text-xs text-slate-400">
        {recording ? "Recording… tap to stop" : "Tap to speak"}
      </span>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
