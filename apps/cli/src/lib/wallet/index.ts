/**
 * Wallet Provider Factory
 *
 * Creates the appropriate wallet provider based on configuration and environment.
 */

import type { WalletProvider } from "./types.js";
import { CDPProvider, createCDPProvider, type CDPProviderOptions } from "./cdp-provider.js";
import { LocalProvider, createLocalProvider, type LocalProviderOptions } from "./local-provider.js";
import { getCDPCredentials, getLocalPrivateKey, type Config } from "../config.js";
import { ConfigError } from "../errors.js";

export type { WalletProvider, SendUSDCParams } from "./types.js";
export { CDPProvider, createCDPProvider, type CDPProviderOptions } from "./cdp-provider.js";
export { LocalProvider, createLocalProvider, type LocalProviderOptions } from "./local-provider.js";

/**
 * Create a wallet provider from config
 */
export async function createWalletFromConfig(config: Config): Promise<WalletProvider> {
  const network = config.network;

  if (config.wallet_type === "cdp") {
    const credentials = getCDPCredentials();
    if (!credentials) {
      throw new ConfigError(
        "CDP credentials not found. Set CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables."
      );
    }

    return createCDPProvider({
      keyName: credentials.keyName,
      privateKey: credentials.privateKey,
      walletId: config.wallet_id,
      network,
    });
  }

  if (config.wallet_type === "local") {
    const privateKey = getLocalPrivateKey();
    if (!privateKey) {
      throw new ConfigError(
        "Local wallet private key not found. Set MOLTED_PRIVATE_KEY environment variable."
      );
    }

    return createLocalProvider({
      privateKey: privateKey as `0x${string}`,
      network,
    });
  }

  throw new ConfigError(`Unknown wallet type: ${config.wallet_type}`);
}

/**
 * Create a new wallet for initialization
 */
export async function createNewWallet(
  type: "cdp" | "local",
  network: "base" | "base-sepolia"
): Promise<{
  provider: WalletProvider;
  walletId?: string;
}> {
  if (type === "cdp") {
    const credentials = getCDPCredentials();
    if (!credentials) {
      throw new ConfigError(
        "CDP credentials required. Set CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables."
      );
    }

    const provider = await createCDPProvider({
      keyName: credentials.keyName,
      privateKey: credentials.privateKey,
      network,
    });

    return {
      provider,
      walletId: (provider as CDPProvider).getWalletId(),
    };
  }

  if (type === "local") {
    const privateKey = getLocalPrivateKey();
    if (!privateKey) {
      throw new ConfigError(
        "Local wallet private key required. Set MOLTED_PRIVATE_KEY environment variable."
      );
    }

    const provider = createLocalProvider({
      privateKey: privateKey as `0x${string}`,
      network,
    });

    return { provider };
  }

  throw new ConfigError(`Unknown wallet type: ${type}`);
}

/**
 * Validate wallet provider can be created from config
 */
export function validateWalletConfig(config: Config): void {
  if (config.wallet_type === "cdp") {
    const credentials = getCDPCredentials();
    if (!credentials) {
      throw new ConfigError(
        "CDP credentials not found. Set CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables."
      );
    }
  } else if (config.wallet_type === "local") {
    const privateKey = getLocalPrivateKey();
    if (!privateKey) {
      throw new ConfigError(
        "Local wallet private key not found. Set MOLTED_PRIVATE_KEY environment variable."
      );
    }
  } else {
    throw new ConfigError(`Unknown wallet type: ${config.wallet_type}`);
  }
}
