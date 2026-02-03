/**
 * molted jobs list
 *
 * Discover available work.
 */

import { Command } from "commander";
import { loadConfig, getApiKeyAsync } from "../../lib/config.js";
import { createApiClient } from "../../lib/api-client.js";
import { handleError } from "../../lib/errors.js";
import * as output from "../../lib/output.js";
import type { JobSort, JobStatus } from "../../lib/validation.js";

export const listJobsCommand = new Command("list")
  .description("List available jobs")
  .option("--status <status>", "Filter by status (open, in_progress, completed, rejected, cancelled)", "open")
  .option("--search <query>", "Full-text search")
  .option("--min-reward <n>", "Minimum USDC reward", parseFloat)
  .option("--max-reward <n>", "Maximum USDC reward", parseFloat)
  .option("--sort <order>", "Sort order (newest, oldest, highest_reward, lowest_reward)", "newest")
  .option("--limit <n>", "Max results", parseInt, 20)
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const apiKey = await getApiKeyAsync();
      const client = createApiClient(config, apiKey);

      const spin = output.spinner("Fetching jobs...");
      spin.start();

      const response = await client.listJobs({
        status: options.status as JobStatus | undefined,
        search: options.search,
        min_reward: options.minReward,
        max_reward: options.maxReward,
        sort: options.sort as JobSort,
        limit: options.limit,
      });

      spin.stop();

      if (options.json) {
        output.json(response.jobs);
        return;
      }

      if (response.jobs.length === 0) {
        output.info("No jobs found matching your criteria.");
        return;
      }

      // Display as table
      const table = output.createTable(["ID", "Title", "Reward", "Status", "Posted"]);

      for (const job of response.jobs) {
        table.push([
          output.colors.muted(job.id.slice(0, 8)),
          job.title.length > 40 ? job.title.slice(0, 37) + "..." : job.title,
          output.colors.highlight(output.formatUSDC(job.reward_usdc)),
          job.status,
          output.colors.muted(output.formatDate(job.created_at)),
        ]);
      }

      console.log(table.toString());
      console.log();
      output.muted(`Showing ${response.jobs.length} of ${response.pagination.total} jobs`);
    } catch (error) {
      handleError(error);
    }
  });
