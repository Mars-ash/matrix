import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { DashboardPage } from "./pages/dashboard.page";
import { JoDetailPage } from "./pages/jo-detail.page";
import { TrialReportPage } from "./pages/trial-report.page";

test.describe("Trial Reports Flow", () => {
  test("Controller can access Trial Reports and view findings", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const joDetailPage = new JoDetailPage(page);
    const trialPage = new TrialReportPage(page);

    await loginPage.goto();
    await loginPage.quickLoginController();

    // Open first JO
    await dashboardPage.openFirstJo();
    await joDetailPage.verifyLoaded();

    // Click Trial Reports link
    await joDetailPage.openTrialReports();
    await trialPage.verifyLoaded();
  });
});
