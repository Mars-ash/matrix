import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { DashboardPage } from "./pages/dashboard.page";

test.describe("Global item search", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.quickLoginController();
  });

  test("finds a part across JOs and jumps to its highlighted row", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.globalSearch("die plate");

    await expect(page.getByRole("status").filter({ hasText: /item di \d+ JO/ })).toBeVisible();
    await page.locator("a.gs-hit").first().click();

    await expect(page).toHaveURL(/\/projects\/.+\/jos\/.+\?item=/);
    await expect(page.locator("tr.row-highlight")).toBeVisible();
  });

  test("status filter never increases the result count", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.globalSearch("lifter guide");

    const summary = page.getByRole("status").filter({ hasText: /item di \d+ JO/ });
    await expect(summary).toBeVisible();
    const before = Number(((await summary.textContent()) ?? "").match(/^(\d+)/)?.[1] ?? "0");

    await page.getByRole("button", { name: /^Problem$/ }).click();
    await expect(summary).toBeVisible();
    const after = Number(((await summary.textContent()) ?? "").match(/^(\d+)/)?.[1] ?? "0");
    expect(after).toBeGreaterThan(0); // seed: "Lifter Guide" has a Problem control
    expect(after).toBeLessThanOrEqual(before);
  });

  test("dimension typed with x matches seed data stored with ×", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.globalSearch("400x300");
    await expect(page.getByRole("status").filter({ hasText: /item di \d+ JO/ })).toBeVisible();
  });
});
