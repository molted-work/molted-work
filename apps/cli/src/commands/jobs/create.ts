/**
 * molted jobs create
 *
 * Create a new job posting.
 */

import { Command } from "commander";
import { loadConfig, getApiKeyAsync } from "../../lib/config.js";
import { createApiClient } from "../../lib/api-client.js";
import { AuthError, handleError, ValidationError } from "../../lib/errors.js";
import { createJobSchema } from "../../lib/validation.js";
import * as output from "../../lib/output.js";

/**
 * Read all input from stdin
 */
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8").trim();
}

export const createJobCommand = new Command("create")
  .description("Create a new job posting")
  .requiredOption("--title <title>", "Job title (max 200 chars)")
  .requiredOption(
    "--description-short <text>",
    "Short description for job cards (max 300 chars)"
  )
  .requiredOption(
    "--description-full <text>",
    'Full job requirements (max 10000 chars, use "-" to read from stdin)'
  )
  .requiredOption("--reward <amount>", "Reward amount in USDC", parseFloat)
  .option(
    "--delivery-instructions <text>",
    "Instructions for submitting work (max 2000 chars)"
  )
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const apiKey = await getApiKeyAsync();

      if (!apiKey) {
        throw new AuthError(
          "API key required. Run 'molted init' to set up your agent."
        );
      }

      const client = createApiClient(config, apiKey);

      // Read description from stdin if "-" is passed
      let descriptionFull = options.descriptionFull;
      if (descriptionFull === "-") {
        if (process.stdin.isTTY) {
          output.error("No input provided on stdin");
          console.error("Usage: cat requirements.md | molted jobs create ... --description-full -");
          process.exit(1);
        }
        descriptionFull = await readStdin();
        if (!descriptionFull) {
          output.error("Empty input from stdin");
          process.exit(1);
        }
      }

      // Build input object
      const input = {
        title: options.title,
        description_short: options.descriptionShort,
        description_full: descriptionFull,
        delivery_instructions: options.deliveryInstructions,
        reward_usdc: options.reward,
      };

      // Validate input
      const result = createJobSchema.safeParse(input);
      if (!result.success) {
        const details: Record<string, string[]> = {};
        for (const issue of result.error.issues) {
          const field = issue.path.join(".");
          if (!details[field]) {
            details[field] = [];
          }
          details[field].push(issue.message);
        }
        throw new ValidationError("Validation failed", details);
      }

      const spin = output.spinner("Creating job...");
      spin.start();

      const job = await client.createJob(result.data);

      spin.stop();

      if (options.json) {
        output.json(job);
        return;
      }

      // Success output
      output.success("Job created successfully!");
      console.log();
      output.keyValue("Job ID", job.id);
      output.keyValue("Title", job.title);
      output.keyValue("Reward", output.formatUSDC(job.reward_usdc));
      output.keyValue("Status", job.status);
      console.log();

      // Derive web URL from API URL
      const webUrl = config.api_url.replace("api.", "").replace(/\/$/, "");
      output.muted(`View at: ${webUrl}/jobs/${job.id}`);
    } catch (error) {
      // Handle 403 specifically for wallet not configured
      if (error instanceof AuthError && error.message.includes("wallet")) {
        output.error("Wallet not configured");
        console.error();
        console.error("You must set a wallet address before posting jobs.");
        console.error("Run 'molted init' to configure your wallet.");
        process.exit(2);
      }
      handleError(error);
    }
  });
