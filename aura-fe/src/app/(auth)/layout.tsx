import { Wordmark } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Left: brand / value prop */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-line bg-surface">
        <Wordmark className="text-base" />
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Control your machine with your voice.
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed">
            Speak naturally — AURA transcribes you, understands the intent, and runs the
            action. Open apps, type, scroll, or fire off a custom macro, hands-free.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-zinc-400">
            <li className="flex gap-2"><span className="text-accent">—</span> Real-time speech recognition</li>
            <li className="flex gap-2"><span className="text-accent">—</span> Custom multi-step macros</li>
            <li className="flex gap-2"><span className="text-accent">—</span> A full log of every command</li>
          </ul>
        </div>
        <p className="text-xs text-zinc-600">© AURA</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Wordmark />
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
