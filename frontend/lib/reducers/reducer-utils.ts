import type { Project, JO, Category } from "../types";
import { uid } from "../format";

export function findProjectAndJo(
  projects: Project[],
  projectId: string,
  joId: string
): { project?: Project; jo?: JO } {
  let project = projects.find(
    (p) => p.id === projectId || (p as any).tempId === projectId
  );
  if (!project) {
    project = projects.find((p) =>
      p.jos?.some((j) => j.id === joId || (j as any).tempId === joId || j.joNumber === joId)
    );
  }
  const jo = project?.jos?.find(
    (j) => j.id === joId || (j as any).tempId === joId || j.joNumber === joId
  );
  return { project, jo };
}

export function findCategoryContext(
  projects: Project[],
  projectId?: string,
  joId?: string,
  categoryId?: string
): { project?: Project; jo?: JO; category?: Category } {
  let project: Project | undefined;
  let jo: JO | undefined;
  let category: Category | undefined;

  if (projectId && joId) {
    const pj = findProjectAndJo(projects, projectId, joId);
    project = pj.project;
    jo = pj.jo;
    if (jo && categoryId) {
      category = jo.categories?.find((c) => c.id === categoryId);
    }
  } else if (joId) {
    for (const p of projects) {
      const j = p.jos?.find(
        (item) => item.id === joId || (item as any).tempId === joId || item.joNumber === joId
      );
      if (j) {
        jo = j;
        project = p;
        if (categoryId) {
          category = j.categories?.find((c) => c.id === categoryId);
        }
        break;
      }
    }
  }

  // Fallback: search globally across all projects and JOs by categoryId
  if (!category && categoryId) {
    for (const p of projects) {
      for (const j of p.jos || []) {
        const c = j.categories?.find((cat) => cat.id === categoryId);
        if (c) {
          category = c;
          jo = j;
          project = p;
          break;
        }
      }
      if (category) break;
    }
  }

  return { project, jo, category };
}

export function addActivity(jo: JO, message: string): void {
  if (!jo.activities) {
    jo.activities = [];
  }
  jo.activities.unshift({
    id: uid(),
    timestamp: new Date().toISOString(),
    message,
  });
}

