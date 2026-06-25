// Token storage.
//
// Web (dev): access token is kept in memory (authStore); the refresh token goes in
// localStorage for simplicity. When this app is wrapped in Tauri for the desktop
// build, swap the refresh-token functions to use Tauri's secure storage plugin
// instead of localStorage (localStorage is not a safe place for long-lived secrets).

const REFRESH_KEY = "aura.refresh";

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_KEY, token);
}

export function clearRefreshToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFRESH_KEY);
}
