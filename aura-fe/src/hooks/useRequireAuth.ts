"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { getRefreshToken, clearRefreshToken, setRefreshToken } from "@/lib/auth";
import { fetchMe } from "@/lib/services";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

/**
 * Protects a route. On mount:
 *  - if there's an in-memory access token, we're good;
 *  - else if a refresh token exists, silently re-hydrate the session;
 *  - else redirect to /login.
 * Returns `ready` (auth check finished) so pages can avoid flashing.
 */
export function useRequireAuth(): { ready: boolean } {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (accessToken) {
        if (active) setReady(true);
        return;
      }
      const refresh = getRefreshToken();
      if (!refresh) {
        router.replace("/login");
        return;
      }
      try {
        const resp = await axios.post(`${BACKEND_URL}/api/auth/refresh/`, { refresh });
        useAuthStore.getState().setAccessToken(resp.data.access);
        if (resp.data.refresh) setRefreshToken(resp.data.refresh);
        const user = await fetchMe();
        useAuthStore.getState().setAuth(user, useAuthStore.getState().accessToken!);
        if (active) setReady(true);
      } catch {
        clearRefreshToken();
        router.replace("/login");
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ready };
}
