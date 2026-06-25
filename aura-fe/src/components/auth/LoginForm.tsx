"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginSchema } from "@/lib/validators";
import { login } from "@/lib/services";
import { useAuthStore } from "@/store/authStore";
import { setRefreshToken } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path[0] as string, i.message])
        )
      );
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const data = await login(parsed.data);
      setAuth(data.user, data.access);
      setRefreshToken(data.refresh);
      router.replace("/dashboard");
    } catch {
      setServerError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        error={errors.email}
        autoComplete="email"
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        error={errors.password}
        autoComplete="current-password"
      />
      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm text-slate-400">
        No account?{" "}
        <Link href="/register" className="text-aura-accent2 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
