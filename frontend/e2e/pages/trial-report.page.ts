import { type Page, expect } from "@playwright/test";

export class TrialReportPage {
  constructor(private readonly page: Page) {}

  async verifyLoaded() {
    await expect(this.page.locator("h1")).toContainText("Trial Report");
  }

  async isNewTrialButtonVisible(): Promise<boolean> {
    const btn = this.page.getByRole("button", { name: "+ New Trial" });
    return await btn.isVisible();
  }
}
