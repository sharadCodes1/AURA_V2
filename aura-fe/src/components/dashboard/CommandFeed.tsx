import type { FeedItem } from "@/types";

function timeAgo(at: number): string {
  const s = Math.round((Date.now() - at) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

function Badge({ item }: { item: FeedItem }) {
  if (item.payload?.action === "converse") {
    return <span className="text-cyan-400 text-xs">replied</span>;
  }
  if (item.payload?.action === "unknown" || item.resolution === "ambiguous") {
    return <span className="text-amber-400 text-xs">unrecognized</span>;
  }
  if (item.execOk === false) {
    return <span className="text-red-400 text-xs">failed</span>;
  }
  if (item.simulated) {
    return <span className="text-zinc-500 text-xs">simulated</span>;
  }
  return <span className="text-accent text-xs">done</span>;
}

export function CommandFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-zinc-600 text-sm py-6 text-center border border-dashed border-line rounded-xl">
        Commands you speak or type will appear here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id} className="card px-4 py-3 animate-fade-up">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium truncate">
              {item.transcript || <span className="text-zinc-500">(audio)</span>}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <Badge item={item} />
              <span className="text-[11px] text-zinc-600">{timeAgo(item.at)}</span>
            </div>
          </div>
          {item.payload && item.payload.action === "converse" && item.payload.spoken_response && (
            <div className="mt-1 text-xs text-zinc-400">{item.payload.spoken_response}</div>
          )}
          {item.payload && item.payload.action !== "unknown" && item.payload.action !== "converse" && (
            <div className="mt-1 text-xs text-zinc-500 font-mono">
              {item.payload.action}
              {item.payload.target ? ` · ${item.payload.target}` : ""}
              {item.execDetail ? `  —  ${item.execDetail}` : ""}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
