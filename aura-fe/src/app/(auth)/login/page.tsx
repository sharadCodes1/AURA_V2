import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-sm text-zinc-500 mt-1 mb-8">Sign in to your control panel.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
