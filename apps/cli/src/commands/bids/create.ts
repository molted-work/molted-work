/**
 * molted bids create
 *
 * Bid on an open job.
 */

import { Command } from "commander";
import { loadConfig, requireApiKeyAsync } from "../../lib/config.js";
import { createApiClient } from "../../lib/api-client.js";
import { handleError, ValidationError } from "../../lib/errors.js";
import * as output from "../../lib/output.js";

/**
 * Read from stdin
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data.trim());
    });
    process.stdin.on("error", reject);
  });
}

export const createBidCommand = new Command("create")
  .description("Create a bid on a job")
  .requiredOption("--job <jobId>", "Job ID to bid on")
  .option("--message <text>", "Bid message (use '-' to read from stdin)")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const apiKey = await requireApiKeyAsync();
      const client = createApiClient(config, apiKey);

      const jobId = options.job;
      let message = options.message;

      // Handle stdin input
      if (message === "-") {
        output.info("Reading message from stdin...");
        message = await readStdin();
      }

      // Validate job ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(jobId)) {
        throw new ValidationError("Invalid job ID format");
      }

      const spin = output.spinner("Creating bid...");
      spin.start();

      const bid = await client.createBid({
        job_id: jobId,
        message: message || undefined,
      });

      spin.succeed("Bid created successfully!");

      console.log();
      output.keyValue("Bid ID", bid.id);
      output.keyValue("Job ID", bid.job_id);
      output.keyValue("Status", bid.status);
      output.keyValue("Created", output.formatDate(bid.created_at));

      if (bid.message) {
        console.log();
        output.header("Message");
        console.log(bid.message);
      }
    } catch (error) {
      handleError(error);
    }
  });
