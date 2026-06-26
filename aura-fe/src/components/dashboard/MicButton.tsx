"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  disabled?: boolean;
  onAudio: (audio: Blob) => void;
}

/**
 * Press-to-record mic with a LIVE level meter driven by the actual input signal
 * (Web Audio AnalyserNode). The ring scales with your voice, so you get immediate
 * proof the mic is capturing — then the recorded clip is handed to onAudio.
 */
export function MicButton({ disabled, onAudio }: Props) {
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0); // 0..1
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => stopMeter();
  }, []);

  function stopMeter() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevel(0);
  }

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Live level metering
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setLevel(Math.min(1, rms * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      // Recording
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/mp4" });
        onAudio(blob);
        stream.getTracks().forEach((t) => t.stop());
        stopMeter();
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Microphone access denied. Grant it in System Settings → Privacy → Microphone.");
      stopMeter();
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  const ringScale = 1 + level * 0.6;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <button
        type="button"
        disabled={disabled}
        onClick={recording ? stop : start}
        className="relative h-28 w-28 rounded-full flex items-center justify-center
          disabled:opacity-30 disabled:cursor-not-allowed group"
        aria-label={recording ? "Stop recording" : "Start recording"}
      >
        {/* live level ring */}
        <span
          className={`absolute rounded-full transition-[transform,opacity] duration-75 ${
            recording ? "bg-accent/20" : "bg-transparent"
          }`}
          style={{
            height: "100%",
            width: "100%",
            transform: `scale(${recording ? ringScale : 1})`,
          }}
        />
        <span
          className={`absolute inset-0 rounded-full border ${
            recording ? "border-accent" : "border-line group-hover:border-zinc-600"
          }`}
        />
        <span
          className={`relative h-16 w-16 rounded-full flex items-center justify-center transition-colors ${
            recording ? "bg-accent text-bg" : "bg-surface2 text-zinc-300 group-hover:text-white"
          }`}
        >
          <MicGlyph active={recording} />
        </span>
      </button>
      <span className="text-xs text-zinc-500">
        {disabled ? "Connecting…" : recording ? "Listening — tap to stop" : "Tap to speak"}
      </span>
      {error && <span className="text-xs text-red-400 max-w-xs text-center">{error}</span>}
    </div>
  );
}

function MicGlyph({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={active ? 1 : 0.9}
      />
    </svg>
  );
}
