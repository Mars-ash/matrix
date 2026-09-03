import { test, expect } from "@playwright/test";

test.describe("Authentication and Role-Based UI", () => {
  test("Controller login gives full mutating capabilities", async ({ page }) => {
    await page.goto("/login");

    // Click quick demo login as Controller
    await page.click("button:has-text('Login sbg Controller')");

    // Should redirect to Dashboard
    await expect(page).toHaveURL("/");

    // Verify Controller role badge is visible in header
    await expect(page.locator("header")).toContainText("Controller");

    // Verify '+ New' action button is visible for Controller
    await expect(page.locator("button:has-text('+ New')")).toBeVisible();
  });

  test("Viewer login gives read-only view", async ({ page }) => {
    await page.goto("/login");

    // Click quick demo login as Viewer
    await page.click("button:has-text('Login sbg Viewer')");

    // Should redirect to Dashboard
    await expect(page).toHaveURL("/");

    // Verify Viewer role badge is visible in header
    await expect(page.locator("header")).toContainText("Viewer");

    // Verify mutating button is hidden and read-only badge is shown
    await expect(page.locator("button:has-text('+ New')")).not.toBeVisible();
    await expect(page.locator("text=Floor Viewer (Read-Only)")).toBeVisible();
  });
});
