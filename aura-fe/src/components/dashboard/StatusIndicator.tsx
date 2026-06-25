import type { SocketStatus } from "@/lib/websocket";

const meta: Record<SocketStatus, { label: string; color: string }> = {
  idle: { label: "Idle", color: "bg-slate-500" },
  connecting: { label: "Connecting…", color: "bg-amber-400" },
  open: { label: "Listening", color: "bg-emerald-400" },
  closed: { label: "Disconnected", color: "bg-slate-500" },
  error: { label: "Error", color: "bg-red-500" },
};

export function StatusIndicator({ status }: { status: SocketStatus }) {
  const { label, color } = meta[status];
  return (
    <div className="flex items-center gap-2 text-sm text-slate-300">
      <span className={`h-2.5 w-2.5 rounded-full ${color} ${status === "open" ? "animate-pulse" : ""}`} />
      {label}
    </div>
  );
}
