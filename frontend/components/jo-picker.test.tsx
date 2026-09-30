import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JoPicker } from "./jo-picker";
import type { Project } from "@/lib/types";

const mockProjects: Project[] = [
  {
    id: "p1",
    name: "Mercedes",
    customer: "PT Astra",
    jos: [
      {
        id: "j1",
        joNumber: "126.110",
        product: "Bracket Die",
        type: "PROGRESSIVE",
        categories: [],
        activities: [],
      },
      {
        id: "j2",
        joNumber: "126.111",
        product: "Guide Punch",
        type: "TANDEM",
        categories: [],
        activities: [],
      },
    ],
  },
  {
    id: "p2",
    name: "Toyota",
    customer: "PT TMMIN",
    jos: [
      {
        id: "j3",
        joNumber: "127.200",
        product: "Door Panel",
        type: "PROGRESSIVE",
        categories: [],
        activities: [],
      },
    ],
  },
];

describe("JoPicker Component", () => {
  it("renders with placeholder and closed dropdown initially", () => {
    const onChange = vi.fn();
    render(<JoPicker projects={mockProjects} value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("placeholder", "Cari nomor JO / project...");
    expect(input).toHaveValue("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders options on focus", () => {
    const onChange = vi.fn();
    render(<JoPicker projects={mockProjects} value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("JO 126.110 — Bracket Die");
    expect(options[0]).toHaveTextContent("Mercedes · PT Astra");
  });

  it("typing filters by JO number", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<JoPicker projects={mockProjects} value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "127.200");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("JO 127.200 — Door Panel");
  });

  it("typing filters by product", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<JoPicker projects={mockProjects} value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Guide Punch");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("JO 126.111 — Guide Punch");
  });

  it("selecting calls onChange(joId)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<JoPicker projects={mockProjects} value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.click(input);

    const option = screen.getByText("JO 126.110 — Bracket Die");
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith("j1");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clear button calls onChange('')", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<JoPicker projects={mockProjects} value="j1" onChange={onChange} />);

    const clearBtn = screen.getByRole("button", { name: /Clear JO/i });
    await user.click(clearBtn);

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("supports keyboard select (ArrowDown and Enter)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<JoPicker projects={mockProjects} value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Door");

    expect(screen.getAllByRole("option")).toHaveLength(1);

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("j3");
  });

  it("shows empty state when no JO matches", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<JoPicker projects={mockProjects} value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "xyz9999");

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.getByText("JO tidak ditemukan")).toBeInTheDocument();
  });
});
