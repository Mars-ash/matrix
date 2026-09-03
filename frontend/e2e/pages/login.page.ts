import { type Page, expect } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
    await expect(this.page.getByRole("heading", { name: "MATRIX" })).toBeVisible();
  }

  async quickLoginController() {
    await this.page.getByRole("button", { name: "Role: Controller" }).click();
    await expect(this.page).toHaveURL("/");
  }

  async quickLoginViewer() {
    await this.page.getByRole("button", { name: "Role: Viewer" }).click();
    await expect(this.page).toHaveURL("/");
  }

  async login(email: string, pass: string = "password123") {
    await this.page.locator("#login-email").fill(email);
    await this.page.locator("#login-password").fill(pass);
    await this.page.getByRole("button", { name: "Sign In to Matrix" }).click();
    await expect(this.page).toHaveURL("/");
  }
}
