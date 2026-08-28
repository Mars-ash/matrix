// ---------------------------------------------------------------------------
// Pure helper functions for trial session management.
// No React dependency — these are plain functions over domain types.
// ---------------------------------------------------------------------------
import type { TrialSession, TrialFinding, TrialFindingStatus } from "./types";
import { uid } from "./format";

/**
 * Convert a YYYY-MM-DD or ISO date string to dd-mm-yyyy format.
 * Returns "" for empty input, or the original string if not in standard date format.
 */
export function formatDateDDMMYYYY(date: string): string {
  if (!date) return "";
  const clean = date.split("T")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return date;
  const [yyyy, mm, dd] = parts;
  if (!/^\d{4}$/.test(yyyy) || !/^\d{1,2}$/.test(mm) || !/^\d{1,2}$/.test(dd)) {
    return date;
  }
  return `${dd.padStart(2, "0")}-${mm.padStart(2, "0")}-${yyyy}`;
}

/**
 * Convert a YYYY-MM-DD date string to ddmmyy format.
 * Returns "" for invalid or empty input.
 */
export function formatTrialDateSuffix(date: string): string {
  if (!date || date.length < 10) return "";
  const parts = date.split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  if (!yyyy || !mm || !dd) return "";
  const y = yyyy.slice(2); // last 2 digits
  if (!/^\d{2}$/.test(dd) || !/^\d{2}$/.test(mm) || !/^\d{2}$/.test(y))
    return "";
  return `${dd}${mm}${y}`;
}

/**
 * Build a trial session name from an optional prefix and a trial date.
 * If prefix is empty, returns the date suffix only.
 */
export function buildTrialSessionName(
  prefix: string,
  trialDate: string
): string {
  const trimmed = prefix.trim();
  const suffix = formatTrialDateSuffix(trialDate);
  if (!trimmed && !suffix) return "";
  if (!trimmed) return suffix;
  if (!suffix) return trimmed;
  return `${trimmed} ${suffix}`;
}

/**
 * Derive the aggregate status of a trial session from its findings.
 * - Empty findings → "On Process"
 * - Any finding "On Process" → "On Process"
 * - All findings "Close" → "Close"
 */
export function deriveTrialSessionStatus(
  session: TrialSession
): TrialFindingStatus {
  if (session.findings.length === 0) return "On Process";
  const allClose = session.findings.every((f) => f.status === "Close");
  return allClose ? "Close" : "On Process";
}

/**
 * Return a sorted copy of findings by `order`. Does not mutate input.
 */
export function sortTrialFindings(findings: TrialFinding[]): TrialFinding[] {
  return [...findings].sort((a, b) => a.order - b.order);
}

/**
 * Clone a trial session, generating new IDs and timestamps.
 * Copies finding text and statuses but empties all photos.
 * Re-sequences finding order values starting at 1.
 */
export function cloneTrialSessionWithoutPhotos(
  source: TrialSession,
  overrides: Partial<
    Omit<TrialSession, "id" | "joId" | "findings" | "createdAt" | "updatedAt">
  > = {}
): TrialSession {
  const now = new Date().toISOString();
  const clonedFindings: TrialFinding[] = sortTrialFindings(
    source.findings
  ).map((f, idx) => ({
    ...f,
    id: uid(),
    order: idx + 1,
    photos: [],
    createdAt: now,
    updatedAt: now,
  }));

  return {
    id: uid(),
    joId: source.joId,
    name: overrides.name ?? source.name,
    trialDate: overrides.trialDate ?? source.trialDate,
    updateDate: overrides.updateDate ?? source.updateDate,
    customer: overrides.customer ?? source.customer,
    jobNo: overrides.jobNo ?? source.jobNo,
    picName: overrides.picName ?? source.picName,
    approvedByName: overrides.approvedByName ?? source.approvedByName,
    findings: clonedFindings,
    createdAt: now,
    updatedAt: now,
  };
}
