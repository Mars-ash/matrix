import { type Page, expect } from "@playwright/test";

export class SubcontTrackerPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/subcont");
    await expect(this.page.getByRole("heading", { name: "Subcont Tracker" })).toBeVisible();
  }

  async verifyLoaded() {
    await expect(this.page.getByRole("heading", { name: "Subcont Tracker" })).toBeVisible();
  }
}
