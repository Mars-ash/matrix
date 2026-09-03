import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { DashboardPage } from "./pages/dashboard.page";

test.describe("Authentication and Role-Based UI", () => {
  test("Controller login gives full mutating capabilities", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.quickLoginController();

    // Verify Controller role badge is visible in header
    const roleText = await dashboardPage.getRoleBadgeText();
    expect(roleText.toLowerCase()).toContain("controller");

    // Verify '+ New' action button is visible for Controller
    const hasNewBtn = await dashboardPage.isNewItemButtonVisible();
    expect(hasNewBtn).toBe(true);
  });

  test("Viewer login gives read-only view", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.quickLoginViewer();

    // Verify Viewer role badge is visible in header
    const roleText = await dashboardPage.getRoleBadgeText();
    expect(roleText.toLowerCase()).toContain("viewer");

    // Verify mutating button is hidden and read-only badge is shown
    const hasNewBtn = await dashboardPage.isNewItemButtonVisible();
    expect(hasNewBtn).toBe(false);
    await expect(page.locator("text=Floor Viewer (Read-Only)")).toBeVisible();
  });
});
