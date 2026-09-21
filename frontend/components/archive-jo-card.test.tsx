import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArchiveJoCard } from "./archive-jo-card";
import { JO } from "@/lib/types";

const mockJO: JO = {
  id: "jo-1",
  joNumber: "JO-2026-001",
  product: "Dies Stamping Upper Cover",
  type: "PROGRESSIVE",
  targetDate: "2026-09-20",
  finishDate: "2026-09-21",
  categories: [
    {
      id: "cat-1",
      label: "PART",
      kind: "Part",
      isCustom: false,
      items: [
        {
          id: "item-1",
          no: "1",
          description: "Upper Cover",
          dimension: "100x50",
          material: "SKD11",
          qty: 1,
          hrc: "60",
          controls: [
            { process: "Material", status: "Done", notes: "" },
            { process: "Machining", status: "Done", notes: "" },
          ],
        },
      ],
    },
  ],
  activities: [],
};

describe("ArchiveJoCard", () => {
  it("renders JO details, product, finish date, and done status badge", () => {
    render(
      <ArchiveJoCard
        jo={mockJO}
        projectId="proj-1"
        projectName="Project Alpha"
        customer="PT Astra"
      />
    );

    expect(screen.getByText("JO-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Dies Stamping Upper Cover")).toBeInTheDocument();
    expect(screen.getByText("PROGRESSIVE")).toBeInTheDocument();
    expect(screen.getByText("21-09-26")).toBeInTheDocument();
    expect(screen.getByText(/PT Astra/i)).toBeInTheDocument();
    expect(screen.getByText(/Project Alpha/i)).toBeInTheDocument();
  });

  it("shows Restore button when onRestore is provided and triggers callback", () => {
    const handleRestore = vi.fn();
    render(
      <ArchiveJoCard
        jo={mockJO}
        projectId="proj-1"
        projectName="Project Alpha"
        onRestore={handleRestore}
      />
    );

    const restoreBtn = screen.getByRole("button", { name: /restore/i });
    expect(restoreBtn).toBeInTheDocument();

    fireEvent.click(restoreBtn);
    expect(handleRestore).toHaveBeenCalledWith(mockJO);
  });

  it("does not show Restore button when onRestore callback is omitted", () => {
    render(
      <ArchiveJoCard
        jo={mockJO}
        projectId="proj-1"
        projectName="Project Alpha"
      />
    );

    expect(screen.queryByRole("button", { name: /restore/i })).not.toBeInTheDocument();
  });
});
