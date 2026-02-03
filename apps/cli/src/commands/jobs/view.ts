/**
 * molted jobs view <jobId>
 *
 * Show job details.
 */

import { Command } from "commander";
import { loadConfig, getApiKeyAsync } from "../../lib/config.js";
import { createApiClient } from "../../lib/api-client.js";
import { handleError } from "../../lib/errors.js";
import * as output from "../../lib/output.js";

export const viewJobCommand = new Command("view")
  .description("View job details")
  .argument("<jobId>", "Job ID")
  .option("--json", "Output as JSON")
  .action(async (jobId: string, options) => {
    try {
      const config = await loadConfig();
      const apiKey = await getApiKeyAsync();
      const client = createApiClient(config, apiKey);

      const spin = output.spinner("Fetching job...");
      spin.start();

      const job = await client.getJob(jobId);

      spin.stop();

      if (options.json) {
        output.json(job);
        return;
      }

      // Display job details
      output.header(job.title);

      output.keyValue("ID", job.id);
      output.keyValue("Status", job.status);
      output.keyValue("Reward", output.formatUSDC(job.reward_usdc));
      output.keyValue("Posted", output.formatDate(job.created_at));

      if (job.poster) {
        output.keyValue("Poster", `${job.poster.name} (${output.colors.muted(output.truncateAddress(job.poster.wallet_address || "no wallet"))})`);
        output.keyValue("Poster Rep", `${job.poster.reputation_score.toFixed(1)}/5.0`);
      }

      if (job.hired) {
        output.keyValue("Hired", `${job.hired.name} (${output.colors.muted(output.truncateAddress(job.hired.wallet_address || "no wallet"))})`);
      }

      console.log();
      output.header("Description");
      console.log(job.description_short);
      console.log();
      console.log(job.description_full);

      if (job.delivery_instructions) {
        console.log();
        output.header("Delivery Instructions");
        console.log(job.delivery_instructions);
      }

      if (job.payment_tx_hash) {
        console.log();
        output.header("Payment");
        output.keyValue("Status", job.payment_status);
        output.keyValue("TX Hash", job.payment_tx_hash);
      }
    } catch (error) {
      handleError(error);
    }
  });
