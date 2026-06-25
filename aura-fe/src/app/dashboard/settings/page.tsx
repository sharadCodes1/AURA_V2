"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  // Local-only settings stub. Persist to backend/Tauri storage later.
  const [wakeWord, setWakeWord] = useState(true);
  const [sensitivity, setSensitivity] = useState(50);

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <section className="bg-aura-panel rounded-2xl border border-slate-800 p-6 mb-6">
        <h3 className="font-semibold mb-4">Account</h3>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-slate-400">Email</dt>
            <dd>{user?.email ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Name</dt>
            <dd>{user ? `${user.first_name} ${user.last_name}`.trim() || "—" : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Verified</dt>
            <dd>{user?.is_verified ? "Yes" : "No"}</dd>
          </div>
        </dl>
      </section>

      <section className="bg-aura-panel rounded-2xl border border-slate-800 p-6">
        <h3 className="font-semibold mb-4">Voice</h3>
        <label className="flex items-center justify-between text-sm mb-4">
          <span>Wake word</span>
          <input
            type="checkbox"
            checked={wakeWord}
            onChange={(e) => setWakeWord(e.target.checked)}
            className="h-4 w-4 accent-aura-accent"
          />
        </label>
        <label className="block text-sm">
          <span className="flex justify-between mb-1">
            <span>Mic sensitivity</span>
            <span className="text-slate-400">{sensitivity}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-full accent-aura-accent"
          />
        </label>
        <p className="text-xs text-slate-500 mt-4">
          These settings are local stubs for now and reset on reload.
        </p>
      </section>
    </div>
  );
}
