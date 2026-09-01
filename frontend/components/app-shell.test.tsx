import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("AppShell navigation", () => {
  it("includes a PO Tracker link beside SC Tracker", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByRole("link", { name: "PO Tracker" })).toHaveAttribute(
      "href",
      "/po-tracker"
    );
    expect(screen.getByRole("link", { name: "SC Tracker" })).toHaveAttribute(
      "href",
      "/subcont"
    );
  });
});
