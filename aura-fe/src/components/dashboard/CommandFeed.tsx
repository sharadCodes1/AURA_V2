import type { FeedItem } from "@/types";

const statusColor: Record<FeedItem["status"], string> = {
  heard: "text-slate-400",
  executed: "text-emerald-400",
  failed: "text-red-400",
};

export function CommandFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-slate-500 text-sm">
        No commands yet. Hit the mic (or use the text box) to try one.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-lg bg-aura-bg border border-slate-800 px-3 py-2 text-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{item.transcript || "(audio)"}</span>
            <span className={statusColor[item.status]}>{item.status}</span>
          </div>
          {item.payload && (
            <div className="text-xs text-slate-400 mt-1">
              → {item.payload.action}
              {item.payload.target ? ` · ${item.payload.target}` : ""}
              {item.payload.spoken_response ? ` · “${item.payload.spoken_response}”` : ""}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
