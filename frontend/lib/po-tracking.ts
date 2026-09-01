import type { Control, ControlStatus } from "./types";

/**
 * Checks if the process is a PO tracking process ("PO" or "Material").
 */
export function isPoTrackingProcess(process: string): process is "PO" | "Material" {
  return process === "PO" || process === "Material";
}

/**
 * Returns the human-readable PO tracking label for the process ("PO" or "PO Mtl").
 */
export function poTrackingLabel(process: string): string {
  return process === "Material" ? "PO Mtl" : process === "PO" ? "PO" : process;
}

/**
 * Returns a compact summary string for a PO/Material control's poTracking detail,
 * or null if no summary information is available.
 */
export function poTrackingSummary(control: Control): string | null {
  const t = control.poTracking;
  if (!t) return null;
  const poNo = t.poNo?.trim();
  const supplier = t.supplier?.trim();
  const targetArrival = t.targetArrival?.trim();

  if (poNo && supplier) {
    return `${poNo} · ${supplier}`;
  }
  if (poNo) {
    return poNo;
  }
  if (supplier) {
    return supplier;
  }
  if (targetArrival) {
    return `Target: ${targetArrival}`;
  }
  return null;
}

/**
 * Calculates deadline warning state for PO/PO Mtl tracking based on targetArrival and sibling Arrival control status.
 * Warning is shown ONLY if targetArrival is set and Arrival status is not "Done".
 */
export function getPoTrackingDeadline(
  targetArrival: string | undefined,
  arrivalStatus: ControlStatus | undefined,
  today: Date = new Date()
): { state: "overdue" | "today" | "soon"; text: string } | null {
  if (!targetArrival || arrivalStatus === "Done") return null;

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const targetDate = new Date(targetArrival);
  targetDate.setHours(0, 0, 0, 0);

  if (isNaN(targetDate.getTime())) return null;

  const diffTime = targetDate.getTime() - todayStart.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { state: "overdue", text: `Overdue ${Math.abs(diffDays)}d` };
  }
  if (diffDays === 0) {
    return { state: "today", text: "Hari H" };
  }
  if (diffDays <= 3) {
    return { state: "soon", text: `H-${diffDays}` };
  }
  return null;
}
