import { test, expect } from "@playwright/test";

test.describe("MATRIX Navigation and Core Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.click("button:has-text('Login sbg Controller')");
    await expect(page).toHaveURL("/");
  });

  test("can navigate to JO detail and view category control tables", async ({ page }) => {
    // Click on the first JO card
    const firstJoCard = page.locator(".card").first();
    await expect(firstJoCard).toBeVisible();
    await firstJoCard.click();

    // Verify URL matches /projects/.../jos/...
    await expect(page).toHaveURL(/\/projects\/.*\/jos\/.*/);

    // Verify sections and table headers
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("table.control-table").first()).toBeVisible();
  });

  test("can navigate to Subcont Tracker", async ({ page }) => {
    await page.click("a:has-text('SC Tracker')");
    await expect(page).toHaveURL("/subcont");
    await expect(page.locator("h1")).toHaveText("Subcont Tracker");
  });

  test("can navigate to PO Tracker", async ({ page }) => {
    await page.click("a:has-text('PO Tracker')");
    await expect(page).toHaveURL("/po-tracker");
    await expect(page.locator("h1")).toHaveText("PO Tracker");
  });
});
