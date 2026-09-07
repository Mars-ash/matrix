import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { DashboardPage } from "./pages/dashboard.page";

test.describe("Authentication and Role-Based UI", () => {
  test("Controller login gives full mutating capabilities", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.quickLoginController();

    // Verify Staff Engineering role badge is visible in header
    const roleText = await dashboardPage.getRoleBadgeText();
    expect(roleText.toLowerCase()).toContain("staff engineering");

    // Verify role switch button is completely removed from header
    await expect(page.locator("button[title*='toggle between Controller and Viewer']")).toHaveCount(0);

    // Verify '+ New' action button is visible for Controller
    const hasNewBtn = await dashboardPage.isNewItemButtonVisible();
    expect(hasNewBtn).toBe(true);
  });

  test("Viewer login gives strict read-only view with all CRUD buttons hidden", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.quickLoginViewer();

    // 1. Dashboard checks
    const roleText = await dashboardPage.getRoleBadgeText();
    expect(roleText.toLowerCase()).toContain("viewer");

    // Verify role switch button is completely removed from header
    await expect(page.locator("button[title*='toggle between Controller and Viewer']")).toHaveCount(0);

    const hasNewBtn = await dashboardPage.isNewItemButtonVisible();
    expect(hasNewBtn).toBe(false);

    // 2. JO Detail page checks
    await dashboardPage.openFirstJo();
    await page.waitForLoadState("networkidle");

    // No CRUD buttons should be visible
    await expect(page.getByRole("button", { name: /\+ Add Data/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Finish JO/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /\+ Add New Category/i })).toHaveCount(0);

    // No checkbox column in control table
    const joCheckboxes = page.locator(".control-table input[type='checkbox']");
    await expect(joCheckboxes).toHaveCount(0);

    // Verify table-viewer class and sticky 'No' column has left: 0px
    const tableViewer = page.locator("table.table-viewer").first();
    await expect(tableViewer).toBeVisible();
    const stickyNo = page.locator(".th-sticky-no").first();
    const leftVal = await stickyNo.evaluate((el) => window.getComputedStyle(el).left);
    expect(leftVal).toBe("0px");

    // 3. Subcont Tracker page checks
    await page.goto("/subcont");
    await page.waitForLoadState("networkidle");

    // No checkboxes in subcont table
    const scCheckboxes = page.locator(".control-table input[type='checkbox']");
    await expect(scCheckboxes).toHaveCount(0);

    // No floating bulk action bar
    await expect(page.locator(".bulk-action-bar")).toHaveCount(0);

    // Notes button opens read-only dialog without textarea
    const scNoteBtn = page.locator("button[aria-label*='catatan untuk']").first();
    if (await scNoteBtn.count() > 0) {
      await scNoteBtn.click();
      await expect(page.locator(".dialog textarea")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
      await page.getByRole("button", { name: "Tutup" }).click();
    }

    // 4. PO Tracker page checks
    await page.goto("/po-tracker");
    await page.waitForLoadState("networkidle");

    // No checkboxes in PO table
    const poCheckboxes = page.locator(".control-table input[type='checkbox']");
    await expect(poCheckboxes).toHaveCount(0);

    // No floating bulk action bar
    await expect(page.locator(".bulk-action-bar")).toHaveCount(0);

    // Notes button opens read-only dialog without textarea
    const poNoteBtn = page.locator("button[aria-label*='catatan untuk']").first();
    if (await poNoteBtn.count() > 0) {
      await poNoteBtn.click();
      await expect(page.locator(".dialog textarea")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Simpan" })).toHaveCount(0);
      await page.getByRole("button", { name: "Tutup" }).click();
    }
  });
});
