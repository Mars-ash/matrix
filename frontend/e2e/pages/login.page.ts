import { type Page, expect } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
    await expect(this.page.getByRole("heading", { name: "MATRIX" })).toBeVisible();
  }

  async quickLoginController() {
    await this.login("matrix", "eng#1");
  }

  async quickLoginViewer() {
    await this.login("matrix", "matrix#1");
  }

  async login(username: string, pass: string) {
    await this.page.locator("#login-username").fill(username);
    await this.page.locator("#login-password").fill(pass);
    await this.page.getByRole("button", { name: "Sign In" }).click();
    await expect(this.page).toHaveURL("/");
  }
}
