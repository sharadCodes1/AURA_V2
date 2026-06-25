"use client";

import { useEffect, useState } from "react";
import { fetchCommands } from "@/lib/services";
import type { CommandLog } from "@/types";

const statusColor: Record<string, string> = {
  success: "text-emerald-400",
  failed: "text-red-400",
  ambiguous: "text-amber-400",
};

export default function HistoryPage() {
  const [commands, setCommands] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCommands()
      .then(setCommands)
      .catch(() => setError("Could not load history."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">Command history</h2>
      {loading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && commands.length === 0 && (
        <p className="text-slate-500">No commands logged yet.</p>
      )}
      <ul className="flex flex-col gap-2">
        {commands.map((c) => (
          <li
            key={c.id}
            className="rounded-lg bg-aura-panel border border-slate-800 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{c.raw_transcript}</span>
              <span className={statusColor[c.status] ?? "text-slate-400"}>{c.status}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {c.resolved_intent} · {new Date(c.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
