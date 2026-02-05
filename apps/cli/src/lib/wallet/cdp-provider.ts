/**
 * CDP (Coinbase Developer Platform) Wallet Provider
 *
 * Uses @coinbase/coinbase-sdk to manage wallets and sign transactions.
 */

import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import type { WalletProvider, SendUSDCParams } from "./types.js";
import { getUSDCAddress } from "./types.js";
import { PaymentError } from "../errors.js";

export interface CDPProviderOptions {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret?: string;
  walletId?: string;
  network?: "base" | "base-sepolia";
}

export class CDPProvider implements WalletProvider {
  readonly type = "cdp" as const;
  private wallet: Wallet | null = null;
  private walletId?: string;
  private network: "base" | "base-sepolia";
  private _address: `0x${string}` | null = null;

  constructor(private options: CDPProviderOptions) {
    this.walletId = options.walletId;
    this.network = options.network || "base-sepolia";
  }

  get address(): `0x${string}` {
    if (!this._address) {
      throw new PaymentError("CDP wallet not initialized. Call initialize() first.");
    }
    return this._address;
  }

  /**
   * Initialize the CDP SDK and wallet
   */
  async initialize(): Promise<void> {
    try {
      // Configure CDP SDK
      // Note: @coinbase/coinbase-sdk uses apiKeyName/privateKey internally
      // We accept CDP_API_KEY_ID/CDP_API_KEY_SECRET and map them
      Coinbase.configure({
        apiKeyName: this.options.apiKeyId,
        privateKey: this.options.apiKeySecret,
      });

      // Get or create wallet
      if (this.walletId) {
        // Load existing wallet
        this.wallet = await Wallet.fetch(this.walletId);
      } else {
        // Create new wallet
        const networkId =
          this.network === "base" ? Coinbase.networks.BaseMainnet : Coinbase.networks.BaseSepolia;
        this.wallet = await Wallet.create({ networkId });
        this.walletId = this.wallet.getId() ?? undefined;
      }

      // Get default address
      const defaultAddress = await this.wallet.getDefaultAddress();
      if (!defaultAddress) {
        throw new PaymentError("Failed to get wallet address");
      }
      this._address = defaultAddress.getId() as `0x${string}`;
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      throw new PaymentError(`Failed to initialize CDP wallet: ${(error as Error).message}`);
    }
  }

  /**
   * Get the CDP wallet ID (for saving to config)
   */
  getWalletId(): string | undefined {
    return this.walletId;
  }

  async sendUSDC(params: SendUSDCParams): Promise<`0x${string}`> {
    if (!this.wallet) {
      throw new PaymentError("CDP wallet not initialized");
    }

    try {
      const usdcAddress = getUSDCAddress(params.chainId);

      // Create and send the transfer
      const transfer = await this.wallet.createTransfer({
        amount: params.amount,
        assetId: usdcAddress,
        destination: params.to,
      });

      // Wait for transfer to complete
      await transfer.wait();

      const txHash = transfer.getTransactionHash();
      if (!txHash) {
        throw new PaymentError("Transfer completed but no transaction hash returned");
      }

      return txHash as `0x${string}`;
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      throw new PaymentError(`USDC transfer failed: ${(error as Error).message}`);
    }
  }

  async getUSDCBalance(): Promise<bigint> {
    if (!this.wallet) {
      throw new PaymentError("CDP wallet not initialized");
    }

    try {
      // Get the balance using CDP SDK
      const balances = await this.wallet.listBalances();

      // Find USDC balance
      // CDP SDK returns balance as a Decimal object
      for (const [assetId, balance] of balances) {
        if (assetId.toLowerCase() === "usdc") {
          // Convert to base units (6 decimals)
          const balanceNum = Number(balance);
          return BigInt(Math.floor(balanceNum * 10 ** 6));
        }
      }

      return BigInt(0);
    } catch (error) {
      throw new PaymentError(`Failed to get USDC balance: ${(error as Error).message}`);
    }
  }

  async getETHBalance(): Promise<bigint> {
    if (!this.wallet) {
      throw new PaymentError("CDP wallet not initialized");
    }

    try {
      const balances = await this.wallet.listBalances();

      for (const [assetId, balance] of balances) {
        if (assetId.toLowerCase() === "eth") {
          // Convert to wei (18 decimals)
          const balanceNum = Number(balance);
          return BigInt(Math.floor(balanceNum * 10 ** 18));
        }
      }

      return BigInt(0);
    } catch (error) {
      throw new PaymentError(`Failed to get ETH balance: ${(error as Error).message}`);
    }
  }
}

/**
 * Create and initialize a CDP wallet provider
 */
export async function createCDPProvider(
  options: CDPProviderOptions
): Promise<CDPProvider> {
  const provider = new CDPProvider(options);
  await provider.initialize();
  return provider;
}
