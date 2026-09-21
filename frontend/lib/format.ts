// ---------------------------------------------------------------------------
// Formatting helpers — dates, percentages, labels.
// ---------------------------------------------------------------------------

/** Format a progress value. `null` → "-". */
export function formatProgress(value: number | null): string {
  if (value === null) return "-";
  return `${Math.round(value)}%`;
}

/** Format an ISO-8601 timestamp to a short readable string. */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

/** Generate a valid RFC4122 v4 UUID string. */
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format photo preview URL so it works seamlessly regardless of hostname,
 * protocol (HTTP vs HTTPS), local dev port, or tunnel proxies.
 */
export function formatPhotoUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const storageIndex = url.indexOf("/storage/");
  if (storageIndex !== -1) {
    return url.substring(storageIndex);
  }
  return url;
}
