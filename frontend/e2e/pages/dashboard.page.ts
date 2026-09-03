import { type Page, expect } from "@playwright/test";

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
    await expect(this.page.getByRole("heading", { name: "Project Controlling" })).toBeVisible();
  }

  async search(query: string) {
    const input = this.page.getByPlaceholder("Search projects or JOs...");
    await input.fill(query);
  }

  async openFirstJo() {
    const joWithItems = this.page.locator("a[href*='/projects/'][href*='/jos/']").filter({ hasText: "126.110" });
    if (await joWithItems.count() > 0) {
      await joWithItems.first().click();
    } else {
      await this.page.locator("a[href*='/projects/'][href*='/jos/']").first().click();
    }
    await expect(this.page).toHaveURL(/\/projects\/.*\/jos\/.*/);
  }

  async getRoleBadgeText(): Promise<string> {
    const header = this.page.locator("header");
    return (await header.textContent()) || "";
  }

  async isNewItemButtonVisible(): Promise<boolean> {
    return await this.page.getByRole("button", { name: "+ New" }).isVisible();
  }
}
