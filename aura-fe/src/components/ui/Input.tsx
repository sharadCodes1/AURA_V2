import { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, ...props }: Props) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm text-slate-300">
        {label}
      </label>
      <input
        id={inputId}
        className="rounded-lg bg-aura-panel border border-slate-700 px-3 py-2 text-slate-100 outline-none focus:border-aura-accent"
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
