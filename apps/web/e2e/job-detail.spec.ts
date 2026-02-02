import { test, expect, mocks } from "./fixtures";

test.describe("Job Detail Page", () => {
  test("displays job header with title and reward", async ({ page }) => {
    await page.goto(`/jobs/${mocks.jobs[0].id}`);

    // Verify job title
    await expect(page.getByRole("heading", { name: mocks.jobs[0].title })).toBeVisible();

    // Verify reward amount
    await expect(page.getByText(/150/).first()).toBeVisible();
  });

  test("displays full description section", async ({ page }) => {
    await page.goto(`/jobs/${mocks.jobs[0].id}`);

    // Verify full description header
    await expect(page.getByRole("heading", { name: "Full Description" })).toBeVisible();

    // Verify description content
    await expect(page.getByText(mocks.jobs[0].description_full)).toBeVisible();
  });

  test("displays bids section for open jobs", async ({ page }) => {
    await page.goto(`/jobs/${mocks.jobs[0].id}`);

    // Verify bids section is visible for open job
    await expect(page.getByRole("heading", { name: /Bids/i })).toBeVisible();

    // Verify bid messages are displayed
    for (const bid of mocks.bids) {
      await expect(page.getByText(bid.message!)).toBeVisible();
      await expect(page.getByText(bid.bidder!.name).first()).toBeVisible();
    }
  });

  test("displays poster information", async ({ page }) => {
    await page.goto(`/jobs/${mocks.jobs[0].id}`);

    // Verify posted by section
    await expect(page.getByRole("heading", { name: "Posted By" })).toBeVisible();
    // Use first() since poster name may appear in multiple places
    await expect(page.getByText(mocks.jobs[0].poster!.name).first()).toBeVisible();
  });

  test("displays messages section for in-progress job", async ({ page }) => {
    await page.goto(`/jobs/${mocks.jobs[1].id}`);

    // Verify messages section is visible for in-progress job with hired agent
    await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible();

    // Verify messages are displayed
    for (const message of mocks.messages) {
      await expect(page.getByText(message.content)).toBeVisible();
    }
  });

  test("displays hired agent info for in-progress job", async ({ page }) => {
    await page.goto(`/jobs/${mocks.jobs[1].id}`);

    // Verify hired agent section
    await expect(page.getByRole("heading", { name: "Hired Agent" })).toBeVisible();
    await expect(page.getByText(mocks.jobs[1].hired!.name).first()).toBeVisible();
  });

  test("displays completion proof for completed job", async ({ page }) => {
    await page.goto(`/jobs/${mocks.jobs[2].id}`);

    // Verify completion section is visible for completed job
    await expect(page.getByText(mocks.completion.proof_text)).toBeVisible();
  });

  test("displays delivery instructions when present", async ({ page }) => {
    await page.goto(`/jobs/${mocks.jobs[1].id}`);

    // Verify delivery instructions section
    await expect(page.getByRole("heading", { name: "Delivery Instructions" })).toBeVisible();
    await expect(page.getByText(mocks.jobs[1].delivery_instructions!)).toBeVisible();
  });
});
