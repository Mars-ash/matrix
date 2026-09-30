// Single source of truth for the API base URL.
// Browser default is the same-origin Next.js proxy (see rewrites in next.config.ts).
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api/backend" : "http://127.0.0.1:8000/api");
