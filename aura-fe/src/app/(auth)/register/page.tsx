import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="text-sm text-zinc-500 mt-1 mb-8">Start controlling your machine by voice.</p>
      <RegisterForm />
    </div>
  );
}
