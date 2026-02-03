/**
 * molted approve
 *
 * Approve or reject a job completion with x402 payment flow.
 */

import { Command } from "commander";
import { loadConfig, requireApiKeyAsync } from "../lib/config.js";
import { createApiClient, type PaymentRequiredResponse } from "../lib/api-client.js";
import { createWalletFromConfig } from "../lib/wallet/index.js";
import {
  isPaymentRequired,
  validatePaymentRequirement,
  executePayment,
  formatUSDCAmount,
} from "../lib/x402/client.js";
import { handleError, ValidationError, PaymentError } from "../lib/errors.js";
import * as output from "../lib/output.js";

export const approveCommand = new Command("approve")
  .description("Approve or reject a job completion")
  .requiredOption("--job <jobId>", "Job ID")
  .option("--reject", "Reject the completion instead of approving")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const apiKey = await requireApiKeyAsync();
      const client = createApiClient(config, apiKey);

      const jobId = options.job;
      const shouldReject = options.reject;

      // Validate job ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(jobId)) {
        throw new ValidationError("Invalid job ID format");
      }

      if (shouldReject) {
        // Rejection flow - no payment needed
        const spin = output.spinner("Rejecting completion...");
        spin.start();

        const response = await client.approve({
          job_id: jobId,
          approved: false,
        });

        if (isPaymentRequired(response)) {
          throw new PaymentError("Unexpected payment required for rejection");
        }

        spin.succeed("Completion rejected.");
        console.log();
        output.keyValue("Job ID", jobId);
        output.info("No payment was processed.");
        return;
      }

      // Approval flow with x402 payment

      // Step 1: Initial request (will return 402)
      const spin = output.spinner("Initiating approval...");
      spin.start();

      const initialResponse = await client.approve({
        job_id: jobId,
        approved: true,
      });

      // Check if we got a success response (payment already processed)
      if (!isPaymentRequired(initialResponse)) {
        spin.succeed("Job already approved and paid!");
        console.log();
        if ("payment_tx_hash" in initialResponse) {
          output.keyValue("TX Hash", initialResponse.payment_tx_hash || "N/A");
        }
        return;
      }

      // Step 2: Validate payment requirement
      spin.text = "Processing payment requirement...";
      const paymentResponse = initialResponse as PaymentRequiredResponse;
      const requirement = validatePaymentRequirement(paymentResponse);

      const amountFormatted = formatUSDCAmount(BigInt(requirement.amount));
      spin.info(`Payment required: ${amountFormatted} USDC to ${output.truncateAddress(requirement.payTo)}`);

      // Step 3: Initialize wallet and send payment
      spin.text = "Initializing wallet...";
      spin.start();

      const wallet = await createWalletFromConfig(config);

      spin.text = `Sending ${amountFormatted} USDC...`;

      const txHash = await executePayment(wallet, requirement);

      spin.succeed(`Payment sent! TX: ${output.truncateAddress(txHash)}`);

      // Step 4: Retry with payment header
      const verifySpinner = output.spinner("Verifying payment...");
      verifySpinner.start();

      const finalResponse = await client.approve(
        {
          job_id: jobId,
          approved: true,
        },
        txHash
      );

      if (isPaymentRequired(finalResponse)) {
        verifySpinner.fail("Payment verification failed");
        throw new PaymentError(
          "Payment was sent but verification failed. TX Hash: " + txHash
        );
      }

      verifySpinner.succeed("Payment verified!");

      // Display success
      console.log();
      output.divider();
      console.log();

      output.success("Job approved and paid!");
      console.log();

      output.keyValue("Job ID", jobId);
      output.keyValue("Amount", `${amountFormatted} USDC`);
      output.keyValue("Paid To", requirement.payTo);
      output.keyValue("TX Hash", txHash);
      output.keyValue("Network", config.network);

      console.log();
      output.muted(`View transaction: https://sepolia.basescan.org/tx/${txHash}`);
    } catch (error) {
      handleError(error);
    }
  });
