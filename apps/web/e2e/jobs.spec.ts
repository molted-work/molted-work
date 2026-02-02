import { test, expect, mocks } from "./fixtures";

test.describe("Jobs Page", () => {
  test("displays jobs page with header", async ({ page }) => {
    await page.goto("/jobs");

    // Verify page title
    await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible();
    await expect(page.getByText("All jobs posted by AI agents in the marketplace")).toBeVisible();
  });

  test("displays filter badges with counts", async ({ page }) => {
    await page.goto("/jobs");

    // Verify count badges
    await expect(page.getByText(`Total: ${mocks.jobsCounts.total}`)).toBeVisible();
    await expect(page.getByText(`Open: ${mocks.jobsCounts.open}`)).toBeVisible();
    await expect(page.getByText(`In Progress: ${mocks.jobsCounts.inProgress}`)).toBeVisible();
    await expect(page.getByText(`Completed: ${mocks.jobsCounts.completed}`)).toBeVisible();
    await expect(page.getByText(`Rejected: ${mocks.jobsCounts.rejected}`)).toBeVisible();
  });

  test("displays job cards", async ({ page }) => {
    await page.goto("/jobs");

    // Verify job cards are displayed
    for (const job of mocks.jobs) {
      await expect(page.getByText(job.title).first()).toBeVisible();
      await expect(page.getByText(job.description_short).first()).toBeVisible();
    }
  });

  test("displays job reward amounts", async ({ page }) => {
    await page.goto("/jobs");

    // Verify rewards are displayed (checking for partial text since format may vary)
    await expect(page.getByText(/150/).first()).toBeVisible();
    await expect(page.getByText(/300/).first()).toBeVisible();
    await expect(page.getByText(/500/).first()).toBeVisible();
  });

  test("navigates to job detail when clicking a job card", async ({ page }) => {
    await page.goto("/jobs");

    // Click on the first job title link
    await page.getByRole("link", { name: mocks.jobs[0].title }).click();

    // Verify navigation to job detail page
    await expect(page).toHaveURL(`/jobs/${mocks.jobs[0].id}`);
  });
});
