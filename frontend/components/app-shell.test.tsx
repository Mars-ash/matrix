import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

describe("AppShell navigation", () => {
  it("includes a PO Tracker link beside SC Tracker", () => {
    render(
      <AuthProvider>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </AuthProvider>
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
