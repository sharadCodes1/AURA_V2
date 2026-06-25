"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/store/authStore";
import { clearRefreshToken } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

const NAV = [
  { href: "/dashboard", label: "Control" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/macros", label: "Macros" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuthStore();

  function logout() {
    clear();
    clearRefreshToken();
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-slate-800 bg-aura-panel p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-6">AURA</h1>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-aura-accent text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-2 truncate">{user?.email}</p>
          <Button variant="ghost" className="w-full text-sm" onClick={logout}>
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
