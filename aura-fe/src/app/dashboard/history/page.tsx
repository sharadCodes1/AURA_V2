"use client";

import { useEffect, useState } from "react";
import { fetchCommands } from "@/lib/services";
import type { CommandLog } from "@/types";

const statusColor: Record<string, string> = {
  success: "text-accent",
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold tracking-tight mb-1">History</h1>
      <p className="text-sm text-zinc-500 mb-6">Every command you've issued.</p>

      {loading && <p className="text-zinc-500 text-sm">Loading…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && commands.length === 0 && (
        <p className="text-zinc-600 text-sm py-6 text-center border border-dashed border-line rounded-xl">
          No commands logged yet.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {commands.map((c) => (
          <li key={c.id} className="card px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium truncate">{c.raw_transcript}</span>
              <span className={`text-xs shrink-0 ${statusColor[c.status] ?? "text-zinc-400"}`}>
                {c.status}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-500 font-mono">
              {c.resolved_intent} · {new Date(c.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
