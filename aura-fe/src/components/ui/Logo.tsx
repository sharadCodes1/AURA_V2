// Minimal AURA mark: concentric "sound ring" arcs around a dot.
export function Logo({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="2.5" fill="#2dd4bf" />
      <path
        d="M16.5 7.5a6.5 6.5 0 0 1 0 9"
        stroke="#2dd4bf"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M7.5 16.5a6.5 6.5 0 0 1 0-9"
        stroke="#2dd4bf"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <Logo />
      <span className="text-lg">
        AURA
      </span>
    </span>
  );
}
