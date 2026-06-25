import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-aura-panel rounded-2xl p-8 shadow-xl border border-slate-800">
        <h1 className="text-2xl font-bold mb-1">AURA</h1>
        <p className="text-slate-400 text-sm mb-6">Sign in to your control panel</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
