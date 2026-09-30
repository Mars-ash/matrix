import { describe, expect, it } from "vitest";
import { UNASSIGNED_JO_LABEL, visibleProjects } from "./tracker-items";
import type { Project } from "./types";

describe("tracker-items", () => {
  it("defines UNASSIGNED_JO_LABEL as 'Tanpa JO'", () => {
    expect(UNASSIGNED_JO_LABEL).toBe("Tanpa JO");
  });

  it("drops projects with isSystem true", () => {
    const projects: Project[] = [
      { id: "p1", name: "Normal Project", customer: "Cust 1", jos: [] },
      { id: "p2", name: "Tanpa JO", customer: "-", isSystem: true, jos: [] },
      { id: "p3", name: "Another Project", customer: "Cust 2", isSystem: false, jos: [] },
    ];

    const visible = visibleProjects(projects);
    expect(visible.map((p) => p.id)).toEqual(["p1", "p3"]);
  });
});
