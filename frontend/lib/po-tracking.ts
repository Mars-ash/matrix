import type { Category, Control, ControlStatus, Item, JO, Project } from "./types";

export interface PoTrackingRow {
  project: Project;
  jo: JO;
  category: Category;
  item: Item;
  control: Control;
  arrivalControl?: Control;
  arrivalStatus?: ControlStatus;
  status: ControlStatus;
  process: PoTrackingProcess;
  trackerLabel: string;
  supplier: string;
  poNo: string;
  poDate: string;
  targetArrival: string;
  notes: string;
  originalIndex: number;
}

export type PoTrackingSortMode = "newest" | "oldest" | "deadline" | "jo" | "supplier" | "qty";
export type PoTrackingProcess = "Material" | "PO";

export function isPoTrackingProcess(process: string): process is PoTrackingProcess {
  return process === "Material" || process === "PO";
}

export function poTrackingLabel(process: string): string {
  return process === "Material" ? "PO Mtl" : process === "PO" ? "PO" : process;
}

export function collectPoTrackingRows(projects: Project[]): PoTrackingRow[] {
  const rows: PoTrackingRow[] = [];
  let originalIndex = 0;

  for (const project of projects) {
    for (const jo of project.jos) {
      for (const category of jo.categories) {
        for (const item of category.items) {
          const arrivalControl = item.controls.find((control) => control.process === "Arrival");

          for (const control of item.controls) {
            if (!isPoTrackingProcess(control.process)) continue;

            const tracking = control.poTracking;
            const trackingStatus: ControlStatus =
              control.status === "Problem" || arrivalControl?.status === "Problem"
                ? "Problem"
                : (arrivalControl ? arrivalControl.status === "Done" : control.status === "Done")
                ? "Done"
                : "In Progress";

            rows.push({
              project,
              jo,
              category,
              item,
              control,
              arrivalControl,
              arrivalStatus: arrivalControl?.status,
              status: trackingStatus,
              process: control.process,
              trackerLabel: poTrackingLabel(control.process),
              supplier: tracking?.supplier ?? "",
              poNo: tracking?.poNo ?? "",
              poDate: tracking?.poDate ?? "",
              targetArrival:
                tracking?.targetArrival ??
                arrivalControl?.targetDate ??
                item.arrivalTargetDate ??
                control.targetDate ??
                "",
              notes:
                (control.status === "Problem" && control.notes?.trim())
                  ? control.notes.trim()
                  : (arrivalControl?.status === "Problem" && arrivalControl?.notes?.trim())
                  ? arrivalControl.notes.trim()
                  : tracking?.notes?.trim()
                  ? tracking.notes.trim()
                  : control.notes?.trim()
                  ? control.notes.trim()
                  : arrivalControl?.notes?.trim() || "",
              originalIndex,
            });
            originalIndex++;
          }
        }
      }
    }
  }

  return rows;
}

export function filterPoTrackingRows(rows: PoTrackingRow[], searchQuery: string): PoTrackingRow[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return rows;

  return rows.filter((row) =>
    [
      row.jo.joNumber,
      row.item.no,
      row.item.description,
      row.supplier,
      row.poNo,
      row.trackerLabel,
    ].some((value) => value.toLowerCase().includes(query))
  );
}

export function sortPoTrackingRows(rows: PoTrackingRow[], sortMode: PoTrackingSortMode): PoTrackingRow[] {
  return [...rows].sort((a, b) => {
    if (sortMode === "newest") {
      const dateA = a.poDate ? new Date(a.poDate).getTime() : 0;
      const dateB = b.poDate ? new Date(b.poDate).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return b.originalIndex - a.originalIndex;
    }
    if (sortMode === "oldest") {
      const dateA = a.poDate ? new Date(a.poDate).getTime() : 0;
      const dateB = b.poDate ? new Date(b.poDate).getTime() : 0;
      if (dateA !== dateB) {
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      }
      return a.originalIndex - b.originalIndex;
    }
    if (sortMode === "deadline") {
      const timeA = a.targetArrival ? new Date(a.targetArrival).getTime() : Infinity;
      const timeB = b.targetArrival ? new Date(b.targetArrival).getTime() : Infinity;
      return timeA - timeB;
    }
    if (sortMode === "jo") {
      return a.jo.joNumber.localeCompare(b.jo.joNumber);
    }
    if (sortMode === "supplier") {
      return a.supplier.localeCompare(b.supplier);
    }
    if (sortMode === "qty") {
      return (b.item.qty || 0) - (a.item.qty || 0);
    }
    return 0;
  });
}

export function getPoTrackingDeadline(
  targetArrival: string | undefined,
  arrivalStatus: ControlStatus | undefined,
  today: Date = new Date()
): { state: "overdue" | "today" | "soon"; text: string; diffDays: number } | null {
  if (!targetArrival || arrivalStatus === "Done") return null;

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const target = new Date(targetArrival);
  target.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return null;

  const diffDays = Math.ceil((target.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { state: "overdue", text: `Overdue ${Math.abs(diffDays)}d`, diffDays };
  }
  if (diffDays === 0) {
    return { state: "today", text: "Hari H", diffDays };
  }
  if (diffDays <= 3) {
    return { state: "soon", text: `H-${diffDays}`, diffDays };
  }
  return null;
}

export const PO_DONE_GRACE_MS = 5 * 60 * 1000;

export function poRowKey(row: PoTrackingRow): string {
  return `${row.item.id}-${row.process}`;
}

/** Done rows are archived unless the user marked them Done moments ago in this session. */
export function isPoRowArchived(
  row: PoTrackingRow,
  recentlyDone: Record<string, number>,
  now: number
): boolean {
  if (row.status !== "Done") return false;
  const t = recentlyDone[poRowKey(row)];
  return !(t !== undefined && now - t <= PO_DONE_GRACE_MS);
}
