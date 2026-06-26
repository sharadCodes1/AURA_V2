"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registerSchema } from "@/lib/validators";
import { register } from "@/lib/services";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const parsed = registerSchema.safeParse(form);
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
      await register(parsed.data);
      router.replace("/login?registered=1");
    } catch (err: unknown) {
      // Surface backend field errors (e.g. email already exists) if present.
      let msg = "Registration failed. Please try again.";
      if (typeof err === "object" && err && "response" in err) {
        const data = (err as { response?: { data?: Record<string, string[]> } }).response?.data;
        if (data) {
          const first = Object.values(data)[0];
          if (Array.isArray(first) && first[0]) msg = first[0];
        }
      }
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label="First name"
        name="first_name"
        value={form.first_name}
        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        error={errors.first_name}
      />
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
        autoComplete="new-password"
      />
      <Input
        label="Confirm password"
        name="confirm_password"
        type="password"
        value={form.confirm_password}
        onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
        error={errors.confirm_password}
        autoComplete="new-password"
      />
      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
