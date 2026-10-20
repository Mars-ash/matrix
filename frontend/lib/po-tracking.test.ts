import { describe, expect, it } from "vitest";
import type { Item, Project } from "./types";
import {
  collectPoTrackingRows,
  filterPoTrackingRows,
  getPoTrackingDeadline,
  isItemPoSent,
  isPoRowArchived,
  isPoTrackingProcess,
  poRowKey,
  poTrackingLabel,
  sortPoTrackingRows,
} from "./po-tracking";

const projects: Project[] = [
  {
    id: "project-1",
    name: "Demo Project",
    customer: "Demo Customer",
    jos: [
      {
        id: "jo-1",
        joNumber: "126.300",
        product: "Demo Die",
        type: "PROGRESSIVE",
        categories: [
          {
            id: "cat-part",
            label: "PART",
            kind: "Part",
            isCustom: false,
            items: [
              {
                id: "part-1",
                no: "P1",
                description: "Upper Plate",
                dimension: "100x50",
                material: "S50C",
                qty: 1,
                hrc: "",
                controls: [
                  {
                    process: "Material",
                    status: "In Progress",
                    notes: "",
                    poTracking: {
                      supplier: "PT Baja",
                      poNo: "PO-MTL-001",
                      poDate: "2026-09-01",
                      targetArrival: "2026-09-04",
                      notes: "Cut to size",
                    },
                  },
                  { process: "Arrival", status: "Not Started", notes: "" },
                  { process: "Machining", status: "Not Started", notes: "" },
                ],
              },
            ],
          },
          {
            id: "cat-component",
            label: "COMPONENT",
            kind: "Component",
            isCustom: false,
            items: [
              {
                id: "component-1",
                no: "C1",
                description: "Guide Pin",
                dimension: "D20x80",
                material: "SUJ2",
                qty: 4,
                hrc: "",
                controls: [
                  {
                    process: "PO",
                    status: "Done",
                    notes: "",
                    poTracking: {
                      supplier: "MISUMI",
                      poNo: "PO-COMP-002",
                      poDate: "2026-08-30",
                      targetArrival: "2026-09-02",
                      notes: "",
                    },
                  },
                  { process: "Arrival", status: "Done", notes: "" },
                ],
              },
            ],
          },
        ],
        activities: [],
      },
    ],
  },
];

describe("PO tracking helpers", () => {
  it("identifies only Material and PO as PO tracking processes", () => {
    expect(isPoTrackingProcess("Material")).toBe(true);
    expect(isPoTrackingProcess("PO")).toBe(true);
    expect(isPoTrackingProcess("Arrival")).toBe(false);
    expect(isPoTrackingProcess("Machining")).toBe(false);
  });

  it("labels Part Material rows as PO Mtl and Component PO rows as PO", () => {
    expect(poTrackingLabel("Material")).toBe("PO Mtl");
    expect(poTrackingLabel("PO")).toBe("PO");
  });

  it("collects Part PO Mtl and Component PO rows across projects", () => {
    const rows = collectPoTrackingRows(projects);

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.trackerLabel)).toEqual(["PO Mtl", "PO"]);
    expect(rows.map((row) => row.poNo)).toEqual(["PO-MTL-001", "PO-COMP-002"]);
    expect(rows.map((row) => row.process)).toEqual(["Material", "PO"]);
  });

  it("keeps row references and falls back to control target date", () => {
    const fallbackProjects = structuredClone(projects);
    const materialControl =
      fallbackProjects[0].jos[0].categories[0].items[0].controls[0];
    materialControl.targetDate = "2026-09-08";
    materialControl.poTracking = {
      supplier: "PT Fallback",
      poNo: "PO-FALLBACK",
      poDate: "2026-09-03",
      notes: "Use control target date",
    };

    const [row] = collectPoTrackingRows(fallbackProjects);

    expect(row.project.id).toBe("project-1");
    expect(row.jo.id).toBe("jo-1");
    expect(row.category.id).toBe("cat-part");
    expect(row.item.id).toBe("part-1");
    expect(row.control.process).toBe("Material");
    expect(row.originalIndex).toBe(0);
    expect(row.targetArrival).toBe("2026-09-08");
  });

  it("populates row notes from control notes or arrivalControl notes if tracking notes is empty", () => {
    const testProjects = structuredClone(projects);
    const materialControl =
      testProjects[0].jos[0].categories[0].items[0].controls[0];
    materialControl.notes = "Problem with material hardness";
    materialControl.poTracking = {
      supplier: "PT Fallback",
      poNo: "PO-FALLBACK",
      notes: "",
    };

    const [row] = collectPoTrackingRows(testProjects);
    expect(row.notes).toBe("Problem with material hardness");
  });

  it("filters rows by JO, item, supplier, PO number, and tracker label", () => {
    const rows = collectPoTrackingRows(projects);

    expect(filterPoTrackingRows(rows, "126.300")).toHaveLength(2);
    expect(filterPoTrackingRows(rows, "P1")).toHaveLength(1);
    expect(filterPoTrackingRows(rows, "Upper")).toHaveLength(1);
    expect(filterPoTrackingRows(rows, "MISUMI")).toHaveLength(1);
    expect(filterPoTrackingRows(rows, "PO-MTL-001")).toHaveLength(1);
    expect(filterPoTrackingRows(rows, "PO Mtl")).toHaveLength(1);
  });

  it("sorts rows by procurement fields without mutating the original list", () => {
    const rows = collectPoTrackingRows(projects);
    const originalOrder = rows.map((row) => row.item.id);

    expect(sortPoTrackingRows(rows, "newest").map((row) => row.item.id)).toEqual([
      "part-1",
      "component-1",
    ]);
    expect(sortPoTrackingRows(rows, "oldest").map((row) => row.item.id)).toEqual([
      "component-1",
      "part-1",
    ]);
    expect(sortPoTrackingRows(rows, "deadline").map((row) => row.item.id)).toEqual([
      "component-1",
      "part-1",
    ]);
    expect(sortPoTrackingRows(rows, "qty").map((row) => row.item.id)).toEqual([
      "component-1",
      "part-1",
    ]);
    expect(rows.map((row) => row.item.id)).toEqual(originalOrder);
  });

  it("uses sibling Arrival completion to suppress target arrival warnings", () => {
    expect(
      getPoTrackingDeadline("2026-09-02", "Not Started", new Date("2026-09-01T00:00:00+07:00"))
    ).toEqual({ state: "soon", text: "H-1", diffDays: 1 });

    expect(
      getPoTrackingDeadline("2026-09-02", "Done", new Date("2026-09-01T00:00:00+07:00"))
    ).toBeNull();
  });

  it("returns overdue, today, soon, and empty deadline states", () => {
    const today = new Date("2026-09-01T00:00:00+07:00");

    expect(getPoTrackingDeadline("2026-08-30", "In Progress", today)).toEqual({
      state: "overdue",
      text: "Overdue 2d",
      diffDays: -2,
    });
    expect(getPoTrackingDeadline("2026-09-01", "In Progress", today)).toEqual({
      state: "today",
      text: "Hari H",
      diffDays: 0,
    });
    expect(getPoTrackingDeadline("2026-09-04", "In Progress", today)).toEqual({
      state: "soon",
      text: "H-3",
      diffDays: 3,
    });
    expect(getPoTrackingDeadline("", "In Progress", today)).toBeNull();
    expect(getPoTrackingDeadline("not-a-date", "In Progress", today)).toBeNull();
  });

  it("prioritizes Problem status and notes even when poNo is populated", () => {
    const problemProjects = structuredClone(projects);
    const materialControl =
      problemProjects[0].jos[0].categories[0].items[0].controls[0];
    materialControl.status = "Problem";
    materialControl.notes = "Supplier stock kosong";
    materialControl.poTracking = {
      supplier: "PT Baja",
      poNo: "PO-MTL-001",
      poDate: "2026-09-01",
      targetArrival: "2026-09-04",
      notes: "Supplier stock kosong",
    };

    const [row] = collectPoTrackingRows(problemProjects);
    expect(row.status).toBe("Problem");
    expect(row.notes).toBe("Supplier stock kosong");
  });

  it("shows In Progress in tracker when PO is Done but Arrival is In Progress (Kirim PO)", () => {
    const testProjects = structuredClone(projects);
    const part = testProjects[0].jos[0].categories[0].items[0];
    const mtlCtrl = part.controls.find((c) => c.process === "Material")!;
    const arrCtrl = part.controls.find((c) => c.process === "Arrival")!;
    mtlCtrl.status = "Done";
    arrCtrl.status = "In Progress";

    const [row] = collectPoTrackingRows(testProjects);
    expect(row.status).toBe("In Progress");
    expect(row.control.status).toBe("Done");
    expect(row.arrivalStatus).toBe("In Progress");
  });

  it("shows Done in tracker only when Arrival is Done", () => {
    const testProjects = structuredClone(projects);
    const part = testProjects[0].jos[0].categories[0].items[0];
    const mtlCtrl = part.controls.find((c) => c.process === "Material")!;
    const arrCtrl = part.controls.find((c) => c.process === "Arrival")!;
    mtlCtrl.status = "Done";
    arrCtrl.status = "Done";

    const [row] = collectPoTrackingRows(testProjects);
    expect(row.status).toBe("Done");
  });

  describe("isPoRowArchived", () => {
    const rows = collectPoTrackingRows(projects);
    const doneRow = rows.find((r) => r.status === "Done")!;
    const inProgressRow = rows.find((r) => r.status === "In Progress")!;
    const now = 1000000000000;

    it("returns false for non-Done rows", () => {
      expect(isPoRowArchived(inProgressRow, {}, now)).toBe(false);
    });

    it("returns true for Done row not in recentlyDone map", () => {
      expect(isPoRowArchived(doneRow, {}, now)).toBe(true);
    });

    it("returns false for Done row marked Done 1 minute ago in recentlyDone", () => {
      const recentlyDone = {
        [poRowKey(doneRow)]: now - 1 * 60 * 1000,
      };
      expect(isPoRowArchived(doneRow, recentlyDone, now)).toBe(false);
    });

    it("returns true for Done row marked Done 6 minutes ago in recentlyDone", () => {
      const recentlyDone = {
        [poRowKey(doneRow)]: now - 6 * 60 * 1000,
      };
      expect(isPoRowArchived(doneRow, recentlyDone, now)).toBe(true);
    });
  });

  describe("isItemPoSent", () => {
    it("returns true when Part Material control is Done", () => {
      const item: Item = {
        id: "part-1",
        no: "P1",
        description: "Plate",
        dimension: "",
        material: "",
        qty: 1,
        hrc: "",
        controls: [
          { process: "Material", status: "Done", notes: "" },
          { process: "Arrival", status: "Not Started", notes: "" },
        ],
      };
      expect(isItemPoSent(item, "Part")).toBe(true);
    });

    it("returns true when control has poTracking", () => {
      const item: Item = {
        id: "part-2",
        no: "P2",
        description: "Punch",
        dimension: "",
        material: "",
        qty: 1,
        hrc: "",
        controls: [
          {
            process: "Material",
            status: "In Progress",
            notes: "",
            poTracking: { poNo: "PO-123" },
          },
        ],
      };
      expect(isItemPoSent(item, "Part")).toBe(true);
    });

    it("returns true when Component PO control is Done", () => {
      const item: Item = {
        id: "comp-1",
        no: "C1",
        description: "Screw",
        dimension: "",
        material: "",
        qty: 10,
        hrc: "",
        controls: [
          { process: "PO", status: "Done", notes: "" },
        ],
      };
      expect(isItemPoSent(item, "Component")).toBe(true);
    });

    it("returns false when control is Not Started and has no poTracking", () => {
      const item: Item = {
        id: "part-3",
        no: "P3",
        description: "Block",
        dimension: "",
        material: "",
        qty: 1,
        hrc: "",
        controls: [
          { process: "Material", status: "Not Started", notes: "" },
        ],
      };
      expect(isItemPoSent(item, "Part")).toBe(false);
    });
  });
});
