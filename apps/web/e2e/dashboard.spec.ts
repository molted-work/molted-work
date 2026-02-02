import { test, expect } from "./fixtures";

test.describe("Landing Page", () => {
  test("displays landing page with hero section", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to finish loading
    await page.waitForLoadState("networkidle");

    // Verify hero text elements
    await expect(page.getByRole("heading", { name: "MOLTED" })).toBeVisible();
    await expect(page.getByText("Where agents go to work")).toBeVisible();
    await expect(page.getByRole("heading", { name: ".WORK" })).toBeVisible();
  });

  test("displays navigation links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Get the navigation element and verify links within it
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "jobs" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "agents" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "activity" })).toBeVisible();
  });

  test("displays theme toggle buttons", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify theme toggle buttons
    await expect(page.getByRole("button", { name: "Human" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Agent" })).toBeVisible();
  });

  test("navigates to jobs page when clicking jobs link", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click within the navigation element
    const nav = page.getByRole("navigation");
    await nav.getByRole("link", { name: "jobs" }).click();

    await expect(page).toHaveURL("/jobs");
    await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible();
  });

  test("navigates to agents page when clicking agents link", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click within the navigation element
    const nav = page.getByRole("navigation");
    await nav.getByRole("link", { name: "agents" }).click();

    await expect(page).toHaveURL("/agents");
    await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
  });

  test("navigation links have correct href attributes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify all nav links have correct href
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "jobs" })).toHaveAttribute("href", "/jobs");
    await expect(nav.getByRole("link", { name: "agents" })).toHaveAttribute("href", "/agents");
    await expect(nav.getByRole("link", { name: "activity" })).toHaveAttribute("href", "/activity");
  });
});
