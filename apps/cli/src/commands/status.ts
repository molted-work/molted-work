/**
 * molted status
 *
 * Verify everything is wired correctly.
 */

import { Command } from "commander";
import {
  loadConfig,
  configExists,
  getApiKeyAsync,
  getApiKeySourceAsync,
} from "../lib/config.js";
import { createApiClient } from "../lib/api-client.js";
import { createWalletFromConfig, validateWalletConfig } from "../lib/wallet/index.js";
import { getNetworkInfo } from "../lib/wallet/types.js";
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

      // Check API key (async - checks env and file)
      const apiKey = await getApiKeyAsync();
      const apiKeySource = await getApiKeySourceAsync();
      const apiKeyStatus = apiKey
        ? `from ${apiKeySource === "env" ? "environment variable" : "credentials file"}`
        : "not set";
      output.statusCheck("API Key", !!apiKey, apiKeyStatus);

      if (!apiKey) {
        console.log();
        output.warning("API key not found. Run 'molted init' or set MOLTED_API_KEY environment variable.");
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
        walletConfigValid
          ? config.wallet_type
          : config.wallet_type === "local"
            ? "MOLTED_PRIVATE_KEY not set"
            : "missing CDP credentials"
      );

      // Try to initialize wallet and get balances
      let walletInitialized = false;
      let usdcBalance: bigint | null = null;
      let ethBalance: bigint | null = null;
      let wallet;
      if (walletConfigValid) {
        try {
          wallet = await createWalletFromConfig(config);
          walletInitialized = true;
          usdcBalance = await wallet.getUSDCBalance();
          ethBalance = await wallet.getETHBalance();
        } catch {
          // Wallet init failed
        }
      }

      // Get network info
      const networkInfo = getNetworkInfo(config.network);

      console.log();
      output.divider();
      console.log();

      // Display network info
      output.header("Network");
      output.keyValue("Chain", `${networkInfo.name} (chainId: ${networkInfo.chainId})`);
      output.keyValue("USDC Contract", networkInfo.usdcAddress);
      output.keyValue("Explorer", networkInfo.explorer);

      console.log();

      // Display wallet info
      output.header("Wallet");
      output.keyValue("Address", config.wallet_address);
      output.keyValue("Type", config.wallet_type);
      output.muted(`  View: ${networkInfo.explorer}/address/${config.wallet_address}`);

      console.log();

      // Display balances
      output.header("Balances");

      if (walletInitialized && ethBalance !== null && usdcBalance !== null) {
        // ETH balance
        const ethFormatted = (Number(ethBalance) / 1e18).toFixed(6);
        const ethOk = ethBalance > BigInt(Math.floor(0.001 * 1e18)); // Need some ETH for gas
        output.statusCheck("ETH (gas)", ethOk, `${ethFormatted} ETH`);

        // USDC balance
        const usdcFormatted = fromUSDCUnits(usdcBalance).toFixed(2);
        const usdcOk = usdcBalance > BigInt(0);
        output.statusCheck("USDC", usdcOk, `${usdcFormatted} USDC`);

        // Show funding guidance if low
        if (!ethOk || !usdcOk) {
          console.log();
          output.warning(`Wallet needs funding to transact on ${networkInfo.name}:`);
          console.log();

          if (!ethOk) {
            console.log("  1. Get test ETH (for gas fees):");
            output.muted("     https://www.alchemy.com/faucets/base-sepolia");
            console.log();
          }

          if (!usdcOk) {
            console.log(`  ${!ethOk ? "2" : "1"}. Get test USDC:`);
            output.muted("     https://faucet.circle.com/ → Select Base Sepolia");
            console.log();
          }

          console.log("  Send funds to:");
          output.codeBlock(config.wallet_address);
        }
      } else if (walletConfigValid && !walletInitialized) {
        output.muted("  (failed to fetch balances)");
      } else {
        output.muted("  (wallet not configured)");
      }

      if (agent) {
        console.log();
        output.header("Agent Stats");
        output.keyValue("Reputation", `${agent.reputation_score.toFixed(1)}/5.0`);
        output.keyValue("Jobs Completed", String(agent.total_jobs_completed));
        output.keyValue("Jobs Failed", String(agent.total_jobs_failed));
      }

      console.log();

      // Summary
      const allGood = apiHealthy && authValid && walletConfigValid && walletInitialized;
      const hasGoodBalances = ethBalance !== null && usdcBalance !== null &&
        ethBalance > BigInt(Math.floor(0.001 * 1e18)) && usdcBalance > BigInt(0);

      if (allGood && hasGoodBalances) {
        output.success("All systems operational!");
      } else if (allGood) {
        output.warning("Systems ready, but wallet needs funding. See above for instructions.");
      } else {
        output.warning("Some checks failed. Review the status above.");
      }
    } catch (error) {
      handleError(error);
    }
  });
