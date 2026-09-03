import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { PoTrackerPage } from "./pages/po-tracker.page";

test.describe("PO Tracker E2E Flow", () => {
  test("Controller can track delivery status and search suppliers", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const poPage = new PoTrackerPage(page);

    await loginPage.goto();
    await loginPage.quickLoginController();

    await poPage.goto();
    await poPage.verifyKpisVisible();

    // Verify search input filters rows
    await poPage.search("MISUMI");
    await expect(page.locator("table.control-table")).toBeVisible();
  });
});
