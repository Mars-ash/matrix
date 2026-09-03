import { type Page, expect } from "@playwright/test";

export class PoTrackerPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/po-tracker");
    await expect(this.page.getByRole("heading", { name: "PO Tracker" })).toBeVisible();
  }

  async verifyKpisVisible() {
    const kpiGrid = this.page.locator(".kpi-grid");
    await expect(kpiGrid.getByText("Active PO", { exact: true })).toBeVisible();
    await expect(kpiGrid.getByText("Overdue", { exact: true })).toBeVisible();
  }

  async search(query: string) {
    const input = this.page.getByPlaceholder("Search...");
    await input.fill(query);
  }
}
