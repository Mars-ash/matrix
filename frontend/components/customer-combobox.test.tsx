import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustomerCombobox } from "./customer-combobox";
import { DEFAULT_CUSTOMERS } from "@/lib/types";

describe("CustomerCombobox Component", () => {
  it("renders with placeholder and closed dropdown initially", () => {
    const onChange = vi.fn();
    render(<CustomerCombobox value="" onChange={onChange} placeholder="Pilih customer..." />);

    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("placeholder", "Pilih customer...");
    expect(input).toHaveValue("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens dropdown on focus and shows options in alphabetical order", () => {
    const onChange = vi.fn();
    render(<CustomerCombobox value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options.length).toBe(DEFAULT_CUSTOMERS.length);
    expect(options[0]).toHaveTextContent(DEFAULT_CUSTOMERS[0]);
    expect(options[1]).toHaveTextContent(DEFAULT_CUSTOMERS[1]);
  });

  it("filters options when typing a search query", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomerCombobox value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "toyota");

    const options = screen.getAllByRole("option");
    expect(options.length).toBe(1);
    expect(options[0]).toHaveTextContent("PT TOYOTA BOSHOKU INDONESIA");
  });

  it("selects an option on click and calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomerCombobox value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "yutaka");

    const option = screen.getByRole("option", { name: /PT YUTAKA MANUFACTURING INDONESIA/i });
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith("PT YUTAKA MANUFACTURING INDONESIA");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows empty state when no customer matches query", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomerCombobox value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "nonexistent xyz");

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.getByText(/Tidak ada customer yang cocok/i)).toBeInTheDocument();
  });

  it("supports keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomerCombobox value="" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "fuji");

    // filtered should show PT FUJI SEAT INDONESIA
    expect(screen.getAllByRole("option").length).toBe(1);

    // Press Enter to select
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("PT FUJI SEAT INDONESIA");
  });

  it("clears value when clear button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomerCombobox value="PT TOYOTA BOSHOKU INDONESIA" onChange={onChange} />);

    const clearBtn = screen.getByRole("button", { name: /Clear customer/i });
    await user.click(clearBtn);

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("enforces strict selection: reverts to valid value when clicking outside", () => {
    const onChange = vi.fn();
    const { container } = render(
      <div>
        <CustomerCombobox value="PT TOYOTA BOSHOKU INDONESIA" onChange={onChange} />
        <button data-testid="outside">Outside</button>
      </div>
    );

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Random Invalid PT" } });

    // Click outside
    fireEvent.mouseDown(document.body);

    // Value in input should revert to confirmed value
    expect(input).toHaveValue("PT TOYOTA BOSHOKU INDONESIA");
    expect(onChange).not.toHaveBeenCalledWith("Random Invalid PT");
  });
});
