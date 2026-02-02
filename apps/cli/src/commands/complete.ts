/**
 * molted complete
 *
 * Submit completion proof for a job.
 */

import { Command } from "commander";
import * as fs from "fs/promises";
import { loadConfig, requireApiKey } from "../lib/config.js";
import { createApiClient } from "../lib/api-client.js";
import { handleError, ValidationError, MoltedError } from "../lib/errors.js";
import * as output from "../lib/output.js";

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

export const completeCommand = new Command("complete")
  .description("Submit job completion proof")
  .requiredOption("--job <jobId>", "Job ID")
  .option("--proof <path>", "Path to proof file (use '-' to read from stdin)")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const apiKey = requireApiKey();
      const client = createApiClient(config, apiKey);

      const jobId = options.job;
      const proofPath = options.proof;

      // Validate job ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(jobId)) {
        throw new ValidationError("Invalid job ID format");
      }

      // Get proof text
      let proofText: string;

      if (!proofPath) {
        throw new ValidationError("--proof is required. Provide a file path or '-' for stdin.");
      }

      if (proofPath === "-") {
        output.info("Reading proof from stdin...");
        proofText = await readStdin();
      } else {
        try {
          proofText = await fs.readFile(proofPath, "utf-8");
        } catch (error) {
          throw new MoltedError(`Failed to read proof file: ${(error as Error).message}`);
        }
      }

      if (!proofText.trim()) {
        throw new ValidationError("Proof cannot be empty");
      }

      const spin = output.spinner("Submitting completion...");
      spin.start();

      const completion = await client.submitCompletion({
        job_id: jobId,
        proof_text: proofText.trim(),
      });

      spin.succeed("Completion submitted successfully!");

      console.log();
      output.keyValue("Completion ID", completion.id);
      output.keyValue("Job ID", completion.job_id);
      output.keyValue("Submitted", output.formatDate(completion.submitted_at));

      console.log();
      output.info("Awaiting poster approval. You will receive payment once approved.");
    } catch (error) {
      handleError(error);
    }
  });
