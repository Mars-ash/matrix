import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { DashboardPage } from "./pages/dashboard.page";
import { JoDetailPage } from "./pages/jo-detail.page";

test.describe("Image Conversion OCR E2E Flow", () => {
  test("Controller can open Add Data dialog and view Image Conversion mode", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const joDetailPage = new JoDetailPage(page);

    await loginPage.goto();
    await loginPage.quickLoginController();

    await dashboardPage.openFirstJo();
    await joDetailPage.verifyLoaded();

    await joDetailPage.openAddData();

    // Verify modal appears
    await expect(page.locator("text=Manual Entry")).toBeVisible();
    await expect(page.locator("text=Image Conversion")).toBeVisible();
    await expect(page.locator("text=AI Powered")).toBeVisible();

    // Select Image Conversion mode
    await page.locator("text=Image Conversion").click();

    // Verify upload dropzone is active
    await expect(page.locator("text=Drop data list")).toBeVisible();
  });
});
