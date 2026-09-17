import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrialReportPrintView } from "./trial-report-print-view";
import { SUBCONT_SUPPLIERS, type TrialSession } from "@/lib/types";

const mockSession: TrialSession = {
  id: "ts-print-1",
  joId: "jo-1",
  name: "Trial 1",
  trialDate: "2026-09-08",
  updateDate: "2026-09-08",
  customer: "PT Honda",
  jobNo: "126.110",
  picName: "Budi",
  approvedByName: "Andi",
  findings: [],
  createdAt: "2026-09-08T10:00:00.000Z",
  updatedAt: "2026-09-08T10:00:00.000Z",
};

describe("TrialReportPrintView Logo & Subcont Suppliers", () => {
  it("renders BKP logo when project company is BKP", () => {
    render(
      <TrialReportPrintView
        sessions={[mockSession]}
        company="BKP"
      />
    );

    const logo = screen.getByRole("img", { name: /PT\. Bintang Kinerja Perdana Logo/i });
    expect(logo).toBeDefined();
    expect(logo.getAttribute("src")).toBe("/logo/LOGO BKP.png");
  });

  it("renders default company logo when project company is BMI", () => {
    render(
      <TrialReportPrintView
        sessions={[mockSession]}
        company="BMI"
      />
    );

    const logo = screen.getByRole("img", { name: /Company Logo/i });
    expect(logo).toBeDefined();
    expect(logo.getAttribute("src")).toBe("/company-logo.png");
  });

  it("includes IDM COATING in SUBCONT_SUPPLIERS", () => {
    expect(SUBCONT_SUPPLIERS).toContain("IDM COATING");
  });
});
