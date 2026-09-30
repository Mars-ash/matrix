import type { Category, Control, Item, JO, Project } from "./types";

export interface SubcontRow {
  project: Project;
  jo: JO;
  category: Category;
  item: Item;
  arrivalControl?: Control;
  originalIndex: number;
}

export const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function collectSubcontRows(projects: Project[]): SubcontRow[] {
  const rows: SubcontRow[] = [];
  let itemCounter = 0;

  for (const project of projects) {
    for (const jo of project.jos) {
      for (const category of jo.categories) {
        for (const item of category.items) {
          if (item.isSubcont) {
            rows.push({
              project,
              jo,
              category,
              item,
              arrivalControl: item.controls.find((c) => c.process === "Arrival"),
              originalIndex: itemCounter++,
            });
          }
        }
      }
    }
  }
  return rows;
}

export function isSubcontArchived(item: Item, now: number): boolean {
  if (item.subcontStatus !== "Done") return false;
  if (!item.subcontDoneAt) return true;
  return now - new Date(item.subcontDoneAt).getTime() > FIVE_MINUTES_MS;
}
