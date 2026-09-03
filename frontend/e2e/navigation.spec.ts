import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { DashboardPage } from "./pages/dashboard.page";
import { JoDetailPage } from "./pages/jo-detail.page";
import { SubcontTrackerPage } from "./pages/subcont-tracker.page";
import { PoTrackerPage } from "./pages/po-tracker.page";

test.describe("MATRIX Navigation and Core Workflows", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.quickLoginController();
  });

  test("can navigate to JO detail and view category control tables", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const joDetailPage = new JoDetailPage(page);

    await dashboardPage.openFirstJo();
    await joDetailPage.verifyLoaded();
  });

  test("can navigate to Subcont Tracker", async ({ page }) => {
    const scPage = new SubcontTrackerPage(page);
    await page.getByRole("link", { name: "SC Tracker" }).click();
    await scPage.verifyLoaded();
  });

  test("can navigate to PO Tracker", async ({ page }) => {
    const poPage = new PoTrackerPage(page);
    await page.getByRole("link", { name: "PO Tracker" }).click();
    await poPage.goto();
    await poPage.verifyKpisVisible();
  });
});
