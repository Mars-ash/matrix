import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ScrollToTop } from "./scroll-to-top";

describe("ScrollToTop component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  it("renders a button with symbol only and no text", () => {
    render(<ScrollToTop />);
    const btn = screen.getByRole("button", { name: /kembali ke atas/i });
    expect(btn).toBeInTheDocument();
    // Check that button textContent is empty (no text label)
    expect(btn.textContent).toBe("");
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("is hidden initially when scrollY is 0", () => {
    render(<ScrollToTop />);
    const btn = screen.getByRole("button", { name: /kembali ke atas/i });
    expect(btn).toHaveStyle({ opacity: "0", pointerEvents: "none" });
  });

  it("becomes visible when user scrolls down beyond threshold", () => {
    render(<ScrollToTop />);
    const btn = screen.getByRole("button", { name: /kembali ke atas/i });

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 300, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(btn).toHaveStyle({ opacity: "1", pointerEvents: "auto" });
  });

  it("calls window.scrollTo({ top: 0, behavior: 'smooth' }) when clicked", () => {
    render(<ScrollToTop />);
    const btn = screen.getByRole("button", { name: /kembali ke atas/i });

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 300, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    fireEvent.click(btn);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
