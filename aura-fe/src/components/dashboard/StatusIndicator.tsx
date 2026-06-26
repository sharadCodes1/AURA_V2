import type { SocketStatus } from "@/lib/websocket";

const meta: Record<SocketStatus, { label: string; color: string }> = {
  idle: { label: "Idle", color: "bg-zinc-500" },
  connecting: { label: "Connecting", color: "bg-amber-400" },
  open: { label: "Connected", color: "bg-accent" },
  closed: { label: "Disconnected", color: "bg-zinc-500" },
  error: { label: "Connection error", color: "bg-red-500" },
};

export function StatusIndicator({ status }: { status: SocketStatus }) {
  const { label, color } = meta[status];
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <span className={`relative flex h-2 w-2`}>
        {status === "open" && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 animate-ping`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
      </span>
      {label}
    </div>
  );
}
