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

/** Generate a simple unique id (good enough for prototype local state). */
export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
