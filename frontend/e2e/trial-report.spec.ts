import { test, expect } from "@playwright/test";

test.describe("Trial Reports Flow", () => {
  test("Controller can access Trial Reports and view findings", async ({ page }) => {
    await page.goto("/login");
    await page.click("button:has-text('Login sbg Controller')");
    await expect(page).toHaveURL("/");

    // Open first JO
    await page.locator(".card").first().click();
    await expect(page).toHaveURL(/\/projects\/.*\/jos\/.*/);

    // Click Trial Reports link
    await page.click("a:has-text('Trial Reports')");
    await expect(page).toHaveURL(/\/trial-reports/);

    // Verify trial report UI elements
    await expect(page.locator("h1")).toContainText("Trial Report");
  });
});
