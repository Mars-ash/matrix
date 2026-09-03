import { type Page, expect } from "@playwright/test";

export class JoDetailPage {
  constructor(private readonly page: Page) {}

  async verifyLoaded() {
    await expect(this.page.locator("h1")).toBeVisible();
    await expect(this.page.locator(".jo-detail-header")).toBeVisible();
  }

  async openTrialReports() {
    await this.page.getByRole("link", { name: "Trial Reports" }).click();
    await expect(this.page).toHaveURL(/\/trial-reports/);
  }

  async openAddData() {
    const addDataBtn = this.page.getByRole("button", { name: "+ Add Data" }).first();
    await expect(addDataBtn).toBeVisible();
    await addDataBtn.click();
  }

  async isAddDataVisible(): Promise<boolean> {
    const btn = this.page.getByRole("button", { name: "+ Add Data" }).first();
    return await btn.isVisible();
  }
}
