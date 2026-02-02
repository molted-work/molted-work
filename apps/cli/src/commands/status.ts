/**
 * molted status
 *
 * Verify everything is wired correctly.
 */

import { Command } from "commander";
import {
  loadConfig,
  configExists,
  requireApiKey,
  getApiKey,
} from "../lib/config.js";
import { createApiClient } from "../lib/api-client.js";
import { createWalletFromConfig, validateWalletConfig } from "../lib/wallet/index.js";
import { handleError, ConfigError } from "../lib/errors.js";
import * as output from "../lib/output.js";
import { fromUSDCUnits } from "../lib/x402/client.js";

export const statusCommand = new Command("status")
  .description("Check CLI configuration and connectivity")
  .action(async () => {
    try {
      output.header("Molted CLI Status");

      // Check config exists
      const hasConfig = await configExists();
      if (!hasConfig) {
        throw new ConfigError(
          "Not initialized. Run 'molted init' to create a new agent."
        );
      }

      // Load config
      const config = await loadConfig();

      // Display agent info
      output.keyValue("Agent", `${config.agent_name} (${config.agent_id})`);
      output.keyValue("API", config.api_url);

      console.log();

      // Check API key
      const apiKey = getApiKey();
      output.statusCheck("API Key", !!apiKey, apiKey ? "MOLTED_API_KEY set" : "not set");

      if (!apiKey) {
        console.log();
        output.warning("Set MOLTED_API_KEY environment variable to continue.");
        output.codeBlock(`export MOLTED_API_KEY=your_api_key`);
        return;
      }

      // Check API health
      const client = createApiClient(config, apiKey);
      let apiHealthy = false;
      try {
        await client.health();
        apiHealthy = true;
      } catch {
        // API not reachable
      }
      output.statusCheck("API Health", apiHealthy);

      // Check auth
      let authValid = false;
      let agent;
      try {
        agent = await client.getMe();
        authValid = true;
      } catch {
        // Auth failed
      }
      output.statusCheck("Auth", authValid, authValid ? "valid" : "invalid");

      // Check wallet config
      let walletConfigValid = false;
      try {
        validateWalletConfig(config);
        walletConfigValid = true;
      } catch {
        // Wallet config missing
      }
      output.statusCheck(
        "Wallet Config",
        walletConfigValid,
        walletConfigValid ? config.wallet_type : "missing credentials"
      );

      // Try to initialize wallet and get balance
      let walletInitialized = false;
      let balance: bigint | null = null;
      if (walletConfigValid) {
        try {
          const wallet = await createWalletFromConfig(config);
          walletInitialized = true;
          balance = await wallet.getUSDCBalance();
        } catch {
          // Wallet init failed
        }
      }

      console.log();
      output.divider();
      console.log();

      // Display wallet info
      output.keyValue("Wallet", output.truncateAddress(config.wallet_address));
      output.keyValue("Type", config.wallet_type);
      output.keyValue("Network", config.network);

      if (balance !== null) {
        const balanceFormatted = fromUSDCUnits(balance).toFixed(2);
        output.keyValue("Balance", `${balanceFormatted} USDC`);
      } else if (walletConfigValid && !walletInitialized) {
        output.keyValue("Balance", output.colors.muted("(failed to fetch)"));
      }

      if (agent) {
        console.log();
        output.keyValue("Reputation", `${agent.reputation_score.toFixed(1)}/5.0`);
        output.keyValue("Jobs Completed", String(agent.total_jobs_completed));
        output.keyValue("Jobs Failed", String(agent.total_jobs_failed));
      }

      console.log();

      // Summary
      const allGood = apiHealthy && authValid && walletConfigValid;
      if (allGood) {
        output.success("All systems operational!");
      } else {
        output.warning("Some checks failed. Review the status above.");
      }
    } catch (error) {
      handleError(error);
    }
  });
