/**
 * Configuration file management
 *
 * Config file location: ./.molted/config.json
 * API key stored in MOLTED_API_KEY env var only
 */

import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { ConfigError } from "./errors.js";

const CONFIG_DIR = ".molted";
const CONFIG_FILE = "config.json";

export const ConfigSchema = z.object({
  version: z.literal(1),
  api_url: z.string().url(),
  agent_id: z.string().uuid(),
  agent_name: z.string(),
  api_key_prefix: z.string(),
  wallet_type: z.enum(["cdp", "local"]),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  wallet_id: z.string().optional(), // CDP wallet ID
  network: z.enum(["base", "base-sepolia"]),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Get the config directory path
 */
export function getConfigDir(): string {
  return path.join(process.cwd(), CONFIG_DIR);
}

/**
 * Get the config file path
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), CONFIG_FILE);
}

/**
 * Check if config exists
 */
export async function configExists(): Promise<boolean> {
  try {
    await fs.access(getConfigPath());
    return true;
  } catch {
    return false;
  }
}

/**
 * Load and validate config
 */
export async function loadConfig(): Promise<Config> {
  const configPath = getConfigPath();

  try {
    const content = await fs.readFile(configPath, "utf-8");
    const data = JSON.parse(content);
    const result = ConfigSchema.safeParse(data);

    if (!result.success) {
      throw new ConfigError(
        `Invalid config file: ${result.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    return result.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ConfigError(
        "Not initialized. Run 'molted init' to create a new agent."
      );
    }
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(`Failed to load config: ${(error as Error).message}`);
  }
}

/**
 * Save config to file
 */
export async function saveConfig(config: Config): Promise<void> {
  const configDir = getConfigDir();
  const configPath = getConfigPath();

  try {
    // Create config directory if it doesn't exist
    await fs.mkdir(configDir, { recursive: true });

    // Write config file
    await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n");
  } catch (error) {
    throw new ConfigError(`Failed to save config: ${(error as Error).message}`);
  }
}

/**
 * Delete config directory and files
 */
export async function deleteConfig(): Promise<void> {
  const configDir = getConfigDir();

  try {
    await fs.rm(configDir, { recursive: true, force: true });
  } catch (error) {
    throw new ConfigError(`Failed to delete config: ${(error as Error).message}`);
  }
}

/**
 * Get API key from environment
 */
export function getApiKey(): string | undefined {
  return process.env.MOLTED_API_KEY;
}

/**
 * Get API key or throw if not set
 */
export function requireApiKey(): string {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new ConfigError(
      "MOLTED_API_KEY environment variable not set. " +
        "Set it with: export MOLTED_API_KEY=your_api_key"
    );
  }
  return apiKey;
}

/**
 * Get CDP credentials from environment
 */
export function getCDPCredentials(): { keyName: string; privateKey: string } | undefined {
  const keyName = process.env.CDP_API_KEY_NAME;
  const privateKey = process.env.CDP_API_KEY_PRIVATE_KEY;

  if (!keyName || !privateKey) {
    return undefined;
  }

  return { keyName, privateKey };
}

/**
 * Get local wallet private key from environment
 */
export function getLocalPrivateKey(): string | undefined {
  return process.env.MOLTED_PRIVATE_KEY;
}

/**
 * Create a new config object
 */
export function createConfig(params: {
  apiUrl: string;
  agentId: string;
  agentName: string;
  apiKeyPrefix: string;
  walletType: "cdp" | "local";
  walletAddress: string;
  walletId?: string;
  network: "base" | "base-sepolia";
}): Config {
  return {
    version: 1,
    api_url: params.apiUrl,
    agent_id: params.agentId,
    agent_name: params.agentName,
    api_key_prefix: params.apiKeyPrefix,
    wallet_type: params.walletType,
    wallet_address: params.walletAddress,
    wallet_id: params.walletId,
    network: params.network,
  };
}
