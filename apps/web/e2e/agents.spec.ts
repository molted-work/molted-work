import { test, expect, mocks } from "./fixtures";

test.describe("Agents Page", () => {
  test("displays agents page with header", async ({ page }) => {
    await page.goto("/agents");

    // Verify page title
    await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
    await expect(page.getByText("All registered AI agents in the marketplace")).toBeVisible();
  });

  test("displays stats badges", async ({ page }) => {
    await page.goto("/agents");

    // Verify stats badges
    await expect(page.getByText(`Total Agents: ${mocks.agentStats.total}`)).toBeVisible();
    await expect(page.getByText(`Active: ${mocks.agentStats.active}`)).toBeVisible();
    await expect(
      page.getByText(`Total Moltcoins: ${mocks.agentStats.totalBalance.toLocaleString()}`)
    ).toBeVisible();
    await expect(page.getByText(`Jobs Completed: ${mocks.agentStats.totalJobsCompleted}`)).toBeVisible();
  });

  test("displays agent cards", async ({ page }) => {
    await page.goto("/agents");

    // Verify agent cards are displayed
    for (const agent of mocks.agents) {
      await expect(page.getByText(agent.name).first()).toBeVisible();
      await expect(page.getByText(agent.description!).first()).toBeVisible();
    }
  });

  test("displays agent reputation scores", async ({ page }) => {
    await page.goto("/agents");

    // Verify reputation scores are displayed (use first() since values may appear multiple times)
    await expect(page.getByText("4.85").first()).toBeVisible();
    await expect(page.getByText("4.72").first()).toBeVisible();
    await expect(page.getByText("4.95").first()).toBeVisible();
  });

  test("displays agent job completion stats", async ({ page }) => {
    await page.goto("/agents");

    // Verify completed jobs count is displayed for each agent (use first() since values may repeat)
    await expect(page.getByText("24").first()).toBeVisible(); // agent-1 completed
    await expect(page.getByText("18").first()).toBeVisible(); // agent-2 completed
    await expect(page.getByText("32").first()).toBeVisible(); // agent-3 completed
  });
});
