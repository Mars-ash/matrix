import { describe, expect, it } from "vitest";
import { collectSubcontRows, isSubcontArchived } from "./subcont-tracking";
import type { Item, Project } from "./types";

function makeItem(partial: Partial<Item>): Item {
  return {
    id: "item-1",
    no: "01",
    description: "Part A",
    dimension: "",
    material: "",
    qty: 1,
    hrc: "",
    controls: [],
    ...partial,
  };
}

describe("subcont-tracking", () => {
  describe("isSubcontArchived", () => {
    const now = 1000000000000;

    it("returns false for non-Done items", () => {
      const item = makeItem({ isSubcont: true, subcontStatus: "In Progress" });
      expect(isSubcontArchived(item, now)).toBe(false);
    });

    it("returns false for Done items done 1 minute ago (< 5 min grace)", () => {
      const item = makeItem({
        isSubcont: true,
        subcontStatus: "Done",
        subcontDoneAt: new Date(now - 1 * 60 * 1000).toISOString(),
      });
      expect(isSubcontArchived(item, now)).toBe(false);
    });

    it("returns true for Done items done 10 minutes ago (> 5 min grace)", () => {
      const item = makeItem({
        isSubcont: true,
        subcontStatus: "Done",
        subcontDoneAt: new Date(now - 10 * 60 * 1000).toISOString(),
      });
      expect(isSubcontArchived(item, now)).toBe(true);
    });

    it("returns true for Done items with no subcontDoneAt timestamp", () => {
      const item = makeItem({
        isSubcont: true,
        subcontStatus: "Done",
        subcontDoneAt: undefined,
      });
      expect(isSubcontArchived(item, now)).toBe(true);
    });
  });

  describe("collectSubcontRows", () => {
    it("returns only items where isSubcont is true", () => {
      const projects: Project[] = [
        {
          id: "p1",
          name: "Project 1",
          customer: "Cust 1",
          jos: [
            {
              id: "j1",
              joNumber: "126.100",
              product: "Die",
              type: "PROGRESSIVE",
              activities: [],
              categories: [
                {
                  id: "c1",
                  label: "PART",
                  kind: "Part",
                  isCustom: false,
                  items: [
                    makeItem({ id: "i1", isSubcont: true }),
                    makeItem({ id: "i2", isSubcont: false }),
                  ],
                },
              ],
            },
          ],
        },
      ];

      const rows = collectSubcontRows(projects);
      expect(rows).toHaveLength(1);
      expect(rows[0].item.id).toBe("i1");
    });
  });
});
