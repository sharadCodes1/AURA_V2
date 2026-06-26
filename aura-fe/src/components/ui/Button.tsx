import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-bg font-semibold hover:bg-teal-300 active:bg-teal-400 disabled:hover:bg-accent",
  ghost:
    "bg-transparent border border-line text-zinc-200 hover:bg-surface2 hover:border-zinc-600",
  danger: "bg-transparent border border-red-900/60 text-red-400 hover:bg-red-950/40",
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
