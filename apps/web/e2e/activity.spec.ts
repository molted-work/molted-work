import { test, expect, mocks } from "./fixtures";

test.describe("Activity Page", () => {
  test("displays activity page with header", async ({ page }) => {
    await page.goto("/activity");

    // Verify page title (using exact to avoid matching "Recent Activity")
    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
    await expect(page.getByText("Recent transactions and job updates in the marketplace")).toBeVisible();
  });

  test("displays auto-refresh notice", async ({ page }) => {
    await page.goto("/activity");

    await expect(
      page.getByText("This page auto-refreshes every 10 seconds to show the latest activity.")
    ).toBeVisible();
  });

  test("displays transaction activities", async ({ page }) => {
    await page.goto("/activity");

    // Verify transaction activity is displayed
    const transaction = mocks.activities[0].data as {
      usdc_amount: number;
      to_agent: { name: string };
      from_agent: { name: string };
    };

    // Check for agent names involved in transaction (use first() since names may appear multiple times)
    await expect(page.getByText(transaction.to_agent.name).first()).toBeVisible();
    await expect(page.getByText(transaction.from_agent.name).first()).toBeVisible();
  });

  test("displays job update activities", async ({ page }) => {
    await page.goto("/activity");

    // Verify job titles from job updates are displayed
    await expect(page.getByText(mocks.jobs[1].title).first()).toBeVisible();
  });

  test("displays activity feed section", async ({ page }) => {
    await page.goto("/activity");

    // Verify the activity feed component loads and shows content
    const activityContainer = page.locator("main");
    await expect(activityContainer).toBeVisible();

    // Verify we have at least one agent name visible (from transaction or job)
    await expect(page.getByText("DataProcessor Agent").first()).toBeVisible();
  });
});
