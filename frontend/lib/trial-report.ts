// ---------------------------------------------------------------------------
// Pure helper functions for trial session management.
// No React dependency — these are plain functions over domain types.
// ---------------------------------------------------------------------------
import type {
  TrialSession,
  TrialSessionSnapshot,
  TrialFinding,
  TrialFindingStatus,
} from "./types";
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
 * Convert an ISO date/time string or YYYY-MM-DD date to dd-mm-yyyy hh:mm format.
 * Returns "—" for empty input.
 */
export function formatDateTimeDDMMYYYYHHmm(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    if (!dateStr.includes("T") && !dateStr.includes(":") && !dateStr.includes(" ")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const [yyyy, mm, dd] = parts;
        return `${dd.padStart(2, "0")}-${mm.padStart(2, "0")}-${yyyy} 00:00`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
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
 * Convert a 1-based finding order/number to letters: A, B, C... Z, AA, AB...
 */
export function formatFindingLetter(order: number): string {
  let n = Math.max(1, Math.floor(order));
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

/**
 * Return a sorted copy of any entry array with an `order` property.
 * Does not mutate input array.
 */
export function sortTrialEntries<T extends { order: number }>(
  entries: T[]
): T[] {
  return [...entries].sort((a, b) => a.order - b.order);
}

/**
 * Derive the aggregate status of a trial session from its corrective action entries.
 * - No findings or no corrective actions → "On Process"
 * - Any corrective action "On Process" → "On Process"
 * - All corrective actions "Close" → "Close"
 */
export function deriveTrialSessionStatus(
  session: TrialSession
): TrialFindingStatus {
  const allCorrectiveActions = session.findings.flatMap(
    (f) => f.correctiveActions ?? []
  );
  if (allCorrectiveActions.length === 0) return "On Process";
  const allClose = allCorrectiveActions.every((a) => a.status === "Close");
  return allClose ? "Close" : "On Process";
}

/**
 * Derive the status of an individual finding from its corrective actions.
 * - No corrective actions -> "On Process"
 * - Any corrective action "On Process" -> "On Process"
 * - All corrective actions "Close" -> "Close"
 */
export function deriveTrialFindingStatus(
  finding: TrialFinding
): TrialFindingStatus {
  const actions = finding.correctiveActions ?? [];
  if (actions.length === 0) return "On Process";
  const allClose = actions.every((a) => a.status === "Close");
  return allClose ? "Close" : "On Process";
}

/**
 * Return a sorted copy of findings by `order`, with nested entries also sorted.
 * Does not mutate input.
 */
export function sortTrialFindings(findings: TrialFinding[]): TrialFinding[] {
  return [...findings]
    .sort((a, b) => a.order - b.order)
    .map((f) => ({
      ...f,
      problems: sortTrialEntries(f.problems ?? []),
      causes: sortTrialEntries(f.causes ?? []),
      correctiveActions: sortTrialEntries(f.correctiveActions ?? []),
    }));
}

/**
 * Clone a trial session, generating new IDs and timestamps.
 * Copies finding text, target dates, PICs, and statuses, but empties all nested photos.
 * Re-sequences finding and entry order values starting at 1.
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
  ).map((f, fIdx) => ({
    ...f,
    id: uid(),
    order: fIdx + 1,
    problems: sortTrialEntries(f.problems ?? []).map((p, pIdx) => ({
      ...p,
      id: uid(),
      order: pIdx + 1,
      photos: [],
      createdAt: now,
      updatedAt: now,
    })),
    causes: sortTrialEntries(f.causes ?? []).map((c, cIdx) => ({
      ...c,
      id: uid(),
      order: cIdx + 1,
      photos: [],
      createdAt: now,
      updatedAt: now,
    })),
    correctiveActions: sortTrialEntries(f.correctiveActions ?? []).map(
      (a, aIdx) => ({
        ...a,
        id: uid(),
        order: aIdx + 1,
        photos: [],
        createdAt: now,
        updatedAt: now,
      })
    ),
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

/**
 * Create a deep-cloned snapshot of a trial session for viewer consumption.
 */
export function createTrialSessionSnapshot(
  session: TrialSession
): TrialSessionSnapshot {
  return {
    id: session.id,
    joId: session.joId,
    name: session.name,
    trialDate: session.trialDate,
    updateDate: session.updateDate,
    customer: session.customer,
    jobNo: session.jobNo,
    picName: session.picName,
    approvedByName: session.approvedByName,
    findings: JSON.parse(JSON.stringify(session.findings)),
    createdAt: session.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Check whether a session has draft changes that have not been published to the viewer.
 * Returns true if never published or if any relevant field has changed since last publish.
 */
export function hasUnpublishedTrialChanges(session: TrialSession): boolean {
  if (!session.publishedSnapshot) return true;

  const currentPayload = {
    name: session.name,
    trialDate: session.trialDate,
    updateDate: session.updateDate,
    customer: session.customer,
    jobNo: session.jobNo,
    picName: session.picName,
    approvedByName: session.approvedByName,
    findings: session.findings,
  };

  const publishedPayload = {
    name: session.publishedSnapshot.name,
    trialDate: session.publishedSnapshot.trialDate,
    updateDate: session.publishedSnapshot.updateDate,
    customer: session.publishedSnapshot.customer,
    jobNo: session.publishedSnapshot.jobNo,
    picName: session.publishedSnapshot.picName,
    approvedByName: session.publishedSnapshot.approvedByName,
    findings: session.publishedSnapshot.findings,
  };

  return JSON.stringify(currentPayload) !== JSON.stringify(publishedPayload);
}

