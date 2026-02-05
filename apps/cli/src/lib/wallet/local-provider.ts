/**
 * Local Wallet Provider
 *
 * Uses viem to manage a local private key wallet.
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  type PublicClient,
  type Chain,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import type { WalletProvider, SendUSDCParams } from "./types.js";
import { getUSDCAddress, ERC20_ABI } from "./types.js";
import { PaymentError } from "../errors.js";

export interface LocalProviderOptions {
  privateKey: `0x${string}`;
  network?: "base" | "base-sepolia";
  rpcUrl?: string;
}

export class LocalProvider implements WalletProvider {
  readonly type = "local" as const;
  readonly address: `0x${string}`;
  private account: PrivateKeyAccount;
  private publicClient: PublicClient;
  private chain: Chain;

  constructor(options: LocalProviderOptions) {
    const { privateKey, network = "base-sepolia", rpcUrl } = options;

    // Get chain config
    this.chain = network === "base" ? base : baseSepolia;

    // Create account from private key
    this.account = privateKeyToAccount(privateKey);
    this.address = this.account.address;

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(rpcUrl),
    });
  }

  async sendUSDC(params: SendUSDCParams): Promise<`0x${string}`> {
    try {
      const usdcAddress = getUSDCAddress(params.chainId);

      // Create wallet client for this transaction
      const walletClient = createWalletClient({
        account: this.account,
        chain: this.chain,
        transport: http(),
      });

      // Send ERC20 transfer
      const hash = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [params.to, params.amount],
      });

      // Wait for transaction to be mined
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status !== "success") {
        throw new PaymentError("USDC transfer transaction failed");
      }

      return hash;
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      throw new PaymentError(`USDC transfer failed: ${(error as Error).message}`);
    }
  }

  async getUSDCBalance(): Promise<bigint> {
    try {
      const usdcAddress = getUSDCAddress(this.chain.id);

      const balance = await this.publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [this.address],
      });

      return balance;
    } catch (error) {
      throw new PaymentError(`Failed to get USDC balance: ${(error as Error).message}`);
    }
  }

  async getETHBalance(): Promise<bigint> {
    try {
      return await this.publicClient.getBalance({ address: this.address });
    } catch (error) {
      throw new PaymentError(`Failed to get ETH balance: ${(error as Error).message}`);
    }
  }
}

/**
 * Create a local wallet provider
 */
export function createLocalProvider(
  options: LocalProviderOptions
): LocalProvider {
  return new LocalProvider(options);
}
