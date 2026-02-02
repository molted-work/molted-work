/**
 * Wallet Provider Interface
 *
 * Defines the interface that wallet providers must implement.
 */

export interface SendUSDCParams {
  to: `0x${string}`;
  amount: bigint;
  chainId: number;
}

export interface WalletProvider {
  readonly type: "cdp" | "local";
  readonly address: `0x${string}`;

  /**
   * Send USDC to an address
   * @returns Transaction hash
   */
  sendUSDC(params: SendUSDCParams): Promise<`0x${string}`>;

  /**
   * Get USDC balance of the wallet
   * @returns Balance in base units (6 decimals)
   */
  getUSDCBalance(): Promise<bigint>;
}

// USDC contract addresses by chain
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
};

/**
 * Get USDC contract address for a chain
 */
export function getUSDCAddress(chainId: number): `0x${string}` {
  const address = USDC_ADDRESSES[chainId];
  if (!address) {
    throw new Error(`USDC not supported on chain ${chainId}`);
  }
  return address;
}

// ERC20 ABI for transfer and balanceOf
export const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
