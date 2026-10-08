import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MainUnifiedSearch } from "./main-unified-search";
import type { Category, Control, ControlStatus, Item, JO, Project } from "@/lib/types";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function pin(id: string, process: Control["process"], status: ControlStatus, desc = "GUIDE PIN"): Item {
  return {
    id,
    no: "01",
    description: desc,
    dimension: "10 x 20",
    material: "SKD11",
    qty: 1,
    hrc: "-",
    controls: [{ process, status, notes: "" }],
  };
}

function mockProjects(): Project[] {
  const cat: Category = {
    id: "c1",
    label: "UPPER DIES",
    kind: "Part",
    isCustom: false,
    items: [
      pin("i1", "Grinding", "Problem", "PUNCH PIERCING"),
      pin("i2", "Machining", "In Progress", "GUIDE PIN"),
    ],
  };

  const testJo: JO = {
    id: "j1",
    joNumber: "126.110",
    product: "BRACKET ASSY",
    type: "PROGRESSIVE",
    categories: [cat],
    activities: [],
  };

  return [
    {
      id: "p1",
      name: "HB24",
      customer: "PT KAWASAKI",
      jos: [testJo],
    },
  ];
}

function TestWrapper() {
  const [val, setVal] = useState("");
  return <MainUnifiedSearch projects={mockProjects()} value={val} onChange={setVal} />;
}

describe("MainUnifiedSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the unified search input without any filter chips or select dropdowns", () => {
    render(<TestWrapper />);
    const input = screen.getByPlaceholderText(/Cari project, JO, atau part/i);
    expect(input).toBeInTheDocument();
    // Ensure no filter chips or status buttons are present
    expect(screen.queryByRole("button", { name: /^Problem$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^In Progress$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("does not show part dropdown when searching for a project or JO number", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);
    const input = screen.getByPlaceholderText(/Cari project, JO, atau part/i);

    // Type a JO number
    await user.type(input, "126.110");
    expect(screen.queryByText(/Hasil Part/i)).not.toBeInTheDocument();

    // Clear and type a Project name
    await user.clear(input);
    await user.type(input, "HB24");
    expect(screen.queryByText(/Hasil Part/i)).not.toBeInTheDocument();
  });

  it("shows part dropdown when searching for a part name and allows clicking to navigate", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);
    const input = screen.getByPlaceholderText(/Cari project, JO, atau part/i);

    // Type part keyword "punch"
    await user.type(input, "punch");

    // Dropdown header should appear
    expect(screen.getByText(/Hasil Part \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/PUNCH PIERCING/i)).toBeInTheDocument();
    expect(screen.getByText(/126\.110 · UPPER DIES/i)).toBeInTheDocument();

    // Click on the result
    const resultItem = screen.getByRole("button", { name: /PUNCH PIERCING/i });
    await user.click(resultItem);

    // Should navigate to JO page with item query parameter
    expect(mockPush).toHaveBeenCalledWith("/projects/p1/jos/j1?item=i1");
  });

  it("clears search query when clicking the clear button", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);
    const input = screen.getByPlaceholderText(/Cari project, JO, atau part/i);

    await user.type(input, "punch");
    expect(input).toHaveValue("punch");

    const clearBtn = screen.getByRole("button", { name: /Hapus pencarian/i });
    await user.click(clearBtn);

    expect(input).toHaveValue("");
    expect(screen.queryByText(/Hasil Part/i)).not.toBeInTheDocument();
  });
});
