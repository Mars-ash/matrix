import type { Category, Control, ControlStatus, Item, JO, Project } from "./types";

export interface PoTrackingRow {
  project: Project;
  jo: JO;
  category: Category;
  item: Item;
  control: Control;
  arrivalStatus?: ControlStatus;
  process: PoTrackingProcess;
  trackerLabel: string;
  supplier: string;
  poNo: string;
  poDate: string;
  targetArrival: string;
  notes: string;
  originalIndex: number;
}

export type PoTrackingSortMode = "newest" | "deadline" | "jo" | "supplier" | "qty";
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
            rows.push({
              project,
              jo,
              category,
              item,
              control,
              arrivalStatus: arrivalControl?.status,
              process: control.process,
              trackerLabel: poTrackingLabel(control.process),
              supplier: tracking?.supplier ?? "",
              poNo: tracking?.poNo ?? "",
              poDate: tracking?.poDate ?? "",
              targetArrival: tracking?.targetArrival ?? control.targetDate ?? "",
              notes: tracking?.notes ?? control.notes ?? "",
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
