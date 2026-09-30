import type { Project } from "./types";

export const UNASSIGNED_JO_LABEL = "Tanpa JO";

/** Hide the system placeholder project from normal project/JO UIs. */
export function visibleProjects(projects: Project[]): Project[] {
  return projects.filter((p) => !p.isSystem);
}
