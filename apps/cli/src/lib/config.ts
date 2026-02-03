/**
 * Configuration file management
 *
 * Config file location: ./.molted/config.json
 * Credentials file: ./.molted/credentials.json (chmod 600)
 * API key can be loaded from MOLTED_API_KEY env var or credentials file
 */

import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { ConfigError } from "./errors.js";

const CONFIG_DIR = ".molted";
const CONFIG_FILE = "config.json";
const CREDENTIALS_FILE = "credentials.json";

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
 * Credentials file schema
 * Stores API key securely with chmod 600
 */
const CredentialsSchema = z.object({
  version: z.literal(1),
  api_key: z.string().regex(/^ab_[a-f0-9]{32}$/),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

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
 * Get the credentials file path
 */
export function getCredentialsPath(): string {
  return path.join(getConfigDir(), CREDENTIALS_FILE);
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
 * Load credentials from file
 */
export async function loadCredentials(): Promise<Credentials | null> {
  const credentialsPath = getCredentialsPath();
  try {
    const content = await fs.readFile(credentialsPath, "utf-8");
    return CredentialsSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

/**
 * Save credentials to file with chmod 600
 */
export async function saveCredentials(apiKey: string): Promise<void> {
  const configDir = getConfigDir();
  const credentialsPath = getCredentialsPath();

  try {
    // Ensure config directory exists
    await fs.mkdir(configDir, { recursive: true });

    const credentials: Credentials = { version: 1, api_key: apiKey };
    await fs.writeFile(credentialsPath, JSON.stringify(credentials, null, 2) + "\n");
    await fs.chmod(credentialsPath, 0o600); // rw------- (owner read/write only)
  } catch (error) {
    throw new ConfigError(`Failed to save credentials: ${(error as Error).message}`);
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
 * Get API key from environment or credentials file (async)
 * Environment variable takes precedence over file
 */
export async function getApiKeyAsync(): Promise<string | undefined> {
  // Environment variable takes precedence
  if (process.env.MOLTED_API_KEY) {
    return process.env.MOLTED_API_KEY;
  }
  // Fall back to credentials file
  const credentials = await loadCredentials();
  return credentials?.api_key;
}

/**
 * Get API key source (for status display)
 */
export function getApiKeySource(): "env" | "file" | null {
  if (process.env.MOLTED_API_KEY) {
    return "env";
  }
  return null; // Sync function can't check file
}

/**
 * Get API key source async (for status display)
 */
export async function getApiKeySourceAsync(): Promise<"env" | "file" | null> {
  if (process.env.MOLTED_API_KEY) {
    return "env";
  }
  const credentials = await loadCredentials();
  if (credentials?.api_key) {
    return "file";
  }
  return null;
}

/**
 * Require API key (async) - checks env and file
 */
export async function requireApiKeyAsync(): Promise<string> {
  const apiKey = await getApiKeyAsync();
  if (!apiKey) {
    throw new ConfigError(
      "API key not found. Set MOLTED_API_KEY environment variable or run 'molted init' to store credentials locally."
    );
  }
  return apiKey;
}

/**
 * Get CDP credentials from environment
 * Supports both Server Wallet v2 env vars and legacy SDK env vars
 */
export function getCDPCredentials(): {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret?: string;
} | undefined {
  // Try Server Wallet v2 env vars first (preferred)
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  const walletSecret = process.env.CDP_WALLET_SECRET;

  if (apiKeyId && apiKeySecret) {
    return { apiKeyId, apiKeySecret, walletSecret };
  }

  // Fall back to legacy env vars for backwards compatibility
  const legacyKeyName = process.env.CDP_API_KEY_NAME;
  const legacyPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY;

  if (legacyKeyName && legacyPrivateKey) {
    return { apiKeyId: legacyKeyName, apiKeySecret: legacyPrivateKey };
  }

  return undefined;
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
