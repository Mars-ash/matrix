import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GlobalItemSearch } from "./global-item-search";
import type { Category, Control, ControlStatus, Item, JO, Project } from "@/lib/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

function pin(id: string, process: Control["process"], status: ControlStatus): Item {
  return {
    id,
    no: "01",
    description: "GUIDE PIN",
    dimension: "10 x 20",
    material: "SKD11",
    qty: 1,
    hrc: "-",
    controls: [{ process, status, notes: "" }],
  };
}

function jo(id: string, joNumber: string, items: Item[]): JO {
  const category: Category = { id: `c-${id}`, label: "PART", kind: "Part", isCustom: false, items };
  return { id, joNumber, product: "Bracket", type: "PROGRESSIVE", categories: [category], activities: [] };
}

/** 3 JOs, 4 "GUIDE PIN" hits. 126.110 holds a Problem so it sorts first. */
function threeJoProjects(): Project[] {
  return [
    {
      id: "p1",
      name: "Mercedes",
      customer: "PT A",
      jos: [
        jo("j1", "126.110", [pin("i1", "Grinding", "Problem"), pin("i2", "Machining", "Not Started")]),
        jo("j2", "126.111", [pin("i3", "Machining", "Done")]),
        jo("j3", "126.112", [pin("i4", "Machining", "In Progress")]),
      ],
    },
  ];
}

function fourJoProjects(): Project[] {
  const p = threeJoProjects();
  p[0].jos.push(jo("j4", "126.113", [pin("i5", "Machining", "Done")]));
  return p;
}

const searchbox = () => screen.getByRole("searchbox", { name: /Cari part di semua JO/i });

describe("GlobalItemSearch", () => {
  it("shows only the input until the user types", () => {
    render(<GlobalItemSearch projects={threeJoProjects()} />);
    expect(searchbox()).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Problem$/ })).not.toBeInTheDocument();
  });

  it("ignores a single character", async () => {
    const user = userEvent.setup();
    render(<GlobalItemSearch projects={threeJoProjects()} />);
    await user.type(searchbox(), "g");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/Tidak ada item yang cocok/)).not.toBeInTheDocument();
  });

  it("groups duplicates per JO and links every row to its deep link", async () => {
    const user = userEvent.setup();
    render(<GlobalItemSearch projects={threeJoProjects()} />);
    await user.type(searchbox(), "guide pin");

    expect(await screen.findByText("4 item di 3 JO")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute("href", "/projects/p1/jos/j1?item=i1");
    links.forEach((a) => expect(a.getAttribute("href")).toContain("?item="));
  });

  it("narrows results with the Problem status chip and can reset", async () => {
    const user = userEvent.setup();
    render(<GlobalItemSearch projects={threeJoProjects()} />);
    await user.type(searchbox(), "guide pin");
    await screen.findByText("4 item di 3 JO");

    const chip = screen.getByRole("button", { name: /^Problem$/ });
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText("1 item di 1 JO")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset filter" }));
    expect(await screen.findByText("4 item di 3 JO")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<GlobalItemSearch projects={threeJoProjects()} />);
    await user.type(searchbox(), "zzzz");
    expect(await screen.findByText(/Tidak ada item yang cocok/)).toBeInTheDocument();
  });

  it("collapses groups when there are more than 3 JOs and expands on click", async () => {
    const user = userEvent.setup();
    render(<GlobalItemSearch projects={fourJoProjects()} />);
    await user.type(searchbox(), "guide pin");
    await screen.findByText("5 item di 4 JO");

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    await user.click(screen.getAllByRole("button", { expanded: false })[0]);
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });
});
