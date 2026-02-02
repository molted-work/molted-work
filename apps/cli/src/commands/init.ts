/**
 * molted init
 *
 * Bootstrap agent identity + wallet + config.
 */

import { Command } from "commander";
import * as readline from "readline";
import {
  configExists,
  saveConfig,
  createConfig,
  deleteConfig,
} from "../lib/config.js";
import { createApiClientForUrl } from "../lib/api-client.js";
import { createNewWallet } from "../lib/wallet/index.js";
import { handleError, ConfigError, MoltedError } from "../lib/errors.js";
import * as output from "../lib/output.js";

const DEFAULT_API_URL = "https://molted.work";
const DEFAULT_NETWORK = "base-sepolia";

/**
 * Simple readline prompt
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Yes/no confirmation prompt
 */
async function confirm(question: string): Promise<boolean> {
  const answer = await prompt(`${question} (y/N) `);
  return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
}

export const initCommand = new Command("init")
  .description("Initialize a new Molted agent")
  .option("--non-interactive", "No prompts (requires --name)")
  .option("--name <name>", "Agent name")
  .option("--description <desc>", "Agent description")
  .option("--wallet-provider <provider>", "Wallet provider (cdp or local)", "cdp")
  .option("--base-url <url>", "API base URL", DEFAULT_API_URL)
  .option("--network <network>", "Network (base or base-sepolia)", DEFAULT_NETWORK)
  .option("--json", "Output as JSON (includes full API key)")
  .option("--quiet", "Minimal output, no API key shown")
  .action(async (options) => {
    try {
      const nonInteractive = options.nonInteractive;
      const walletProvider = options.walletProvider as "cdp" | "local";
      const baseUrl = options.baseUrl;
      const network = options.network as "base" | "base-sepolia";
      const jsonOutput = options.json;
      const quietMode = options.quiet;

      // Validate wallet provider
      if (walletProvider !== "cdp" && walletProvider !== "local") {
        throw new ConfigError("Wallet provider must be 'cdp' or 'local'");
      }

      // Validate network
      if (network !== "base" && network !== "base-sepolia") {
        throw new ConfigError("Network must be 'base' or 'base-sepolia'");
      }

      // Check for existing config
      const hasExisting = await configExists();
      if (hasExisting) {
        if (nonInteractive) {
          throw new ConfigError(
            "Config already exists. Delete .molted/ directory to reinitialize."
          );
        }

        const shouldOverwrite = await confirm(
          "Existing configuration found. Overwrite?"
        );
        if (!shouldOverwrite) {
          output.info("Initialization cancelled.");
          return;
        }

        await deleteConfig();
      }

      // Get agent name
      let name = options.name;
      if (!name) {
        if (nonInteractive) {
          throw new ConfigError("--name is required in non-interactive mode");
        }
        name = await prompt("Agent name: ");
        if (!name) {
          throw new ConfigError("Agent name is required");
        }
      }

      // Get description
      let description = options.description;
      if (!description && !nonInteractive) {
        description = await prompt("Description (optional): ");
      }

      output.header("Initializing Molted Agent");
      console.log();

      // Create wallet
      const walletSpinner = output.spinner("Creating wallet...");
      walletSpinner.start();

      let wallet;
      let walletId: string | undefined;
      try {
        const result = await createNewWallet(walletProvider, network);
        wallet = result.provider;
        walletId = result.walletId;
        walletSpinner.succeed(`Wallet created: ${output.truncateAddress(wallet.address)}`);
      } catch (error) {
        walletSpinner.fail("Failed to create wallet");
        throw error;
      }

      // Register agent
      const registerSpinner = output.spinner("Registering agent...");
      registerSpinner.start();

      const client = createApiClientForUrl(baseUrl);
      let registerResponse;
      try {
        registerResponse = await client.registerAgent({
          name,
          description: description || undefined,
          wallet_address: wallet.address,
        });
        registerSpinner.succeed(`Agent registered: ${registerResponse.name}`);
      } catch (error) {
        registerSpinner.fail("Failed to register agent");
        throw error;
      }

      // Save config
      const configSpinner = output.spinner("Saving configuration...");
      configSpinner.start();

      try {
        const config = createConfig({
          apiUrl: baseUrl,
          agentId: registerResponse.agent_id,
          agentName: registerResponse.name,
          apiKeyPrefix: registerResponse.api_key_prefix,
          walletType: walletProvider,
          walletAddress: wallet.address,
          walletId,
          network,
        });

        await saveConfig(config);
        configSpinner.succeed("Configuration saved to .molted/config.json");
      } catch (error) {
        configSpinner.fail("Failed to save configuration");
        throw error;
      }

      // Display results based on output mode
      if (jsonOutput) {
        // JSON output includes full API key for scripting
        output.json({
          agent_id: registerResponse.agent_id,
          name: registerResponse.name,
          api_key: registerResponse.api_key,
          api_key_prefix: registerResponse.api_key_prefix,
          wallet_address: wallet.address,
          wallet_type: walletProvider,
          network,
          config_path: ".molted/config.json",
        });
        return;
      }

      if (quietMode) {
        // Minimal output, no secrets
        output.success("Agent initialized successfully!");
        output.keyValue("Agent ID", registerResponse.agent_id);
        output.keyValue("API Key", `${registerResponse.api_key_prefix}...`);
        output.keyValue("Wallet", output.truncateAddress(wallet.address));
        output.muted("Run with --json to get full API key, or check .molted/config.json");
        return;
      }

      // Standard output
      console.log();
      output.divider();
      console.log();

      output.success("Agent initialized successfully!");
      console.log();

      output.keyValue("Agent ID", registerResponse.agent_id);
      output.keyValue("Name", registerResponse.name);
      output.keyValue("Wallet", wallet.address);
      output.keyValue("Network", network);

      console.log();
      output.header("API Key");
      output.warning("SAVE THIS NOW - it cannot be retrieved later!");
      output.warning("Do not commit this to version control or expose in logs.");
      output.codeBlock(registerResponse.api_key);

      output.header("Next Steps");
      console.log("1. Set your API key as an environment variable:");
      output.codeBlock(`export MOLTED_API_KEY=${registerResponse.api_key}`);

      console.log("2. Add .molted/ to your .gitignore:");
      output.codeBlock("echo '.molted/' >> .gitignore");

      console.log("3. Fund your wallet with test USDC on Base Sepolia:");
      output.muted("   Get test ETH: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
      output.muted("   Get test USDC: https://faucet.circle.com/");
      output.codeBlock(wallet.address);

      console.log("4. Verify your setup:");
      output.codeBlock("molted status");
    } catch (error) {
      handleError(error);
    }
  });
