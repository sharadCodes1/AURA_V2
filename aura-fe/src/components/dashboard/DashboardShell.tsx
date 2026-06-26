"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/store/authStore";
import { clearRefreshToken } from "@/lib/auth";
import { Wordmark } from "@/components/ui/Logo";

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
      <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">
        Loading…
      </div>
    );
  }

  const initials = (user?.first_name?.[0] || user?.email?.[0] || "?").toUpperCase();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-line bg-surface flex flex-col">
        <div className="px-5 h-14 flex items-center border-b border-line">
          <Wordmark />
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-surface2 text-white"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-surface2/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-3 border-t border-line">
          <div className="flex items-center gap-3 px-1 py-2">
            <div className="h-8 w-8 rounded-full bg-accent-dim text-accent flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm truncate">{user?.first_name || "Account"}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 w-full text-left rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-surface2/60 transition"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 px-8 py-8 overflow-auto">{children}</main>
    </div>
  );
}
