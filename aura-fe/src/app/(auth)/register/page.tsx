import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-aura-panel rounded-2xl p-8 shadow-xl border border-slate-800">
        <h1 className="text-2xl font-bold mb-1">Create your AURA account</h1>
        <p className="text-slate-400 text-sm mb-6">Start controlling your machine by voice</p>
        <RegisterForm />
      </div>
    </main>
  );
}
