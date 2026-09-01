import { describe, it, expect } from "vitest";
import {
  isPoTrackingProcess,
  poTrackingLabel,
  poTrackingSummary,
  getPoTrackingDeadline,
} from "./po-tracking";
import type { Control } from "./types";

describe("po-tracking helpers", () => {
  describe("isPoTrackingProcess", () => {
    it("returns true for 'PO' and 'Material'", () => {
      expect(isPoTrackingProcess("PO")).toBe(true);
      expect(isPoTrackingProcess("Material")).toBe(true);
    });

    it("returns false for non-PO processes", () => {
      expect(isPoTrackingProcess("Machining")).toBe(false);
      expect(isPoTrackingProcess("Arrival")).toBe(false);
      expect(isPoTrackingProcess("Assembly")).toBe(false);
      expect(isPoTrackingProcess("")).toBe(false);
    });
  });

  describe("poTrackingLabel", () => {
    it("returns 'PO' for PO process and 'PO Mtl' for Material process", () => {
      expect(poTrackingLabel("PO")).toBe("PO");
      expect(poTrackingLabel("Material")).toBe("PO Mtl");
    });
  });

  describe("poTrackingSummary", () => {
    it("returns null when control has no poTracking or empty values", () => {
      const c1: Control = { process: "PO", status: "Not Started", notes: "" };
      expect(poTrackingSummary(c1)).toBeNull();

      const c2: Control = {
        process: "PO",
        status: "In Progress",
        notes: "",
        poTracking: { poNo: "", supplier: "", targetArrival: "", notes: "" },
      };
      expect(poTrackingSummary(c2)).toBeNull();
    });

    it("returns poNo if provided", () => {
      const c: Control = {
        process: "Material",
        status: "In Progress",
        notes: "",
        poTracking: { poNo: "PO-MTL-001", supplier: "", targetArrival: "", notes: "" },
      };
      expect(poTrackingSummary(c)).toBe("PO-MTL-001");
    });

    it("returns poNo with supplier if both provided", () => {
      const c: Control = {
        process: "PO",
        status: "In Progress",
        notes: "",
        poTracking: { poNo: "PO-099", supplier: "PT Baja Utama", targetArrival: "", notes: "" },
      };
      expect(poTrackingSummary(c)).toBe("PO-099 · PT Baja Utama");
    });

    it("falls back to supplier when poNo is empty", () => {
      const c: Control = {
        process: "Material",
        status: "In Progress",
        notes: "",
        poTracking: { poNo: "", supplier: "PT Steel Indo", targetArrival: "", notes: "" },
      };
      expect(poTrackingSummary(c)).toBe("PT Steel Indo");
    });

    it("falls back to targetArrival when poNo and supplier are empty", () => {
      const c: Control = {
        process: "PO",
        status: "In Progress",
        notes: "",
        poTracking: { poNo: "", supplier: "", targetArrival: "2026-09-15", notes: "" },
      };
      expect(poTrackingSummary(c)).toBe("Target: 2026-09-15");
    });
  });

  describe("getPoTrackingDeadline", () => {
    const today = new Date("2026-09-01T00:00:00");

    it("returns null when targetArrival is empty or undefined", () => {
      expect(getPoTrackingDeadline(undefined, "Not Started", today)).toBeNull();
      expect(getPoTrackingDeadline("", "In Progress", today)).toBeNull();
    });

    it("returns null when Arrival status is Done", () => {
      expect(getPoTrackingDeadline("2026-08-25", "Done", today)).toBeNull();
      expect(getPoTrackingDeadline("2026-09-01", "Done", today)).toBeNull();
      expect(getPoTrackingDeadline("2026-09-02", "Done", today)).toBeNull();
    });

    it("returns overdue when targetArrival is in the past and Arrival is not Done", () => {
      const res = getPoTrackingDeadline("2026-08-29", "In Progress", today);
      expect(res).toEqual({
        state: "overdue",
        text: "Overdue 3d",
      });
    });

    it("returns today when targetArrival is today and Arrival is not Done", () => {
      const res = getPoTrackingDeadline("2026-09-01", "Not Started", today);
      expect(res).toEqual({
        state: "today",
        text: "Hari H",
      });
    });

    it("returns soon when targetArrival is within 3 days in the future and Arrival is not Done", () => {
      const res1 = getPoTrackingDeadline("2026-09-02", "In Progress", today);
      expect(res1).toEqual({
        state: "soon",
        text: "H-1",
      });

      const res3 = getPoTrackingDeadline("2026-09-04", "In Progress", today);
      expect(res3).toEqual({
        state: "soon",
        text: "H-3",
      });
    });

    it("returns null when targetArrival is more than 3 days in the future", () => {
      const res = getPoTrackingDeadline("2026-09-10", "In Progress", today);
      expect(res).toBeNull();
    });
  });
});
