/**
 * x402 Payment Configuration
 *
 * Configures the x402 protocol for USDC payments on Base network.
 * Platform acts as a job board only - payments flow directly from poster → worker wallets.
 */

// Network configuration
export const X402_CONFIG = {
  // Facilitator URL for x402 verification
  facilitatorUrl: process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator",

  // Network: 'base' for production, 'base-sepolia' for testing
  network: (process.env.X402_NETWORK || "base-sepolia") as "base" | "base-sepolia",

  // Chain IDs
  chainId: process.env.X402_NETWORK === "base" ? 8453 : 84532,
} as const;

// USDC contract addresses
export const USDC_ADDRESSES = {
  "base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
} as const;

// Get current USDC address based on network
export function getUSDCAddress(): `0x${string}` {
  return USDC_ADDRESSES[X402_CONFIG.network] as `0x${string}`;
}

// x402 header names
export const X402_HEADERS = {
  PAYMENT_REQUIRED: "x-payment-required",
  PAYMENT_SIGNATURE: "x-payment",
  RECEIPT: "x-receipt",
} as const;

// EVM address validation regex
export const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Validate EVM wallet address format
export function isValidEVMAddress(address: string): boolean {
  return EVM_ADDRESS_REGEX.test(address);
}
