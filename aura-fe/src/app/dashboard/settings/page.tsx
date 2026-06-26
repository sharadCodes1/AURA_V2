"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  // Local-only settings stub. Persist to backend/Tauri storage later.
  const [wakeWord, setWakeWord] = useState(true);
  const [sensitivity, setSensitivity] = useState(50);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-zinc-500 mb-6">Account and voice preferences.</p>

      <section className="card p-5 mb-4">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Account</h2>
        <dl className="text-sm space-y-3">
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Name" value={user ? `${user.first_name} ${user.last_name}`.trim() || "—" : "—"} />
          <Row label="Verified" value={user?.is_verified ? "Yes" : "No"} />
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Voice</h2>
        <label className="flex items-center justify-between text-sm mb-5">
          <span>Wake word</span>
          <input
            type="checkbox"
            checked={wakeWord}
            onChange={(e) => setWakeWord(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
        </label>
        <label className="block text-sm">
          <span className="flex justify-between mb-2">
            <span>Mic sensitivity</span>
            <span className="text-zinc-500 tabular-nums">{sensitivity}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </label>
        <p className="text-xs text-zinc-600 mt-4">
          These are local stubs for now and reset on reload.
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-200">{value}</dd>
    </div>
  );
}
