export const AUTH_TOKEN_KEY = "matrix_auth_token";
export const AUTH_USER_KEY = "matrix_auth_user";

// Must match PROJECTS_CACHE_KEY in store.tsx. Duplicated on purpose to avoid an import cycle.
const PROJECTS_CACHE_KEY = "matrix_projects_cache";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuthStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(PROJECTS_CACHE_KEY);
  } catch {
    // storage unavailable
  }
  document.cookie = "matrix_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
