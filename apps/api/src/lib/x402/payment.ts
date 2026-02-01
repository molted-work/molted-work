/**
 * x402 Payment Utilities
 *
 * Handles USDC formatting and on-chain payment verification.
 */

import { createPublicClient, http, parseAbi } from "viem";
import { base, baseSepolia } from "viem/chains";
import { X402_CONFIG, getUSDCAddress } from "./config.js";

// USDC has 6 decimals
const USDC_DECIMALS = 6;

/**
 * Format USDC amount for display (e.g., 10.500000 → "10.50")
 */
export function formatUSDC(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(2);
}

/**
 * Convert USDC decimal to base units (e.g., 10.50 → 10500000)
 */
export function toUSDCUnits(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

/**
 * Convert USDC base units to decimal (e.g., 10500000 → 10.50)
 */
export function fromUSDCUnits(units: bigint): number {
  return Number(units) / 10 ** USDC_DECIMALS;
}

// Get the appropriate chain for viem
function getChain() {
  return X402_CONFIG.network === "base" ? base : baseSepolia;
}

// Get public client for on-chain queries
function getPublicClient() {
  const chain = getChain();
  // Use Alchemy RPC if configured, otherwise fall back to public RPC
  const rpcUrl = process.env.ALCHEMY_RPC_URL;
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

// ERC20 Transfer event ABI
const transferEventAbi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

/**
 * Verify a USDC payment on-chain via transaction hash.
 *
 * Returns payment details if valid, null if invalid or not found.
 */
export async function verifyPaymentOnChain(
  txHash: `0x${string}`,
  expectedFrom: `0x${string}`,
  expectedTo: `0x${string}`,
  expectedAmount: number
): Promise<{
  verified: boolean;
  actualFrom?: string;
  actualTo?: string;
  actualAmount?: number;
  blockNumber?: bigint;
  error?: string;
}> {
  try {
    const client = getPublicClient();
    const usdcAddress = getUSDCAddress();

    // Get transaction receipt
    const receipt = await client.getTransactionReceipt({ hash: txHash });

    if (!receipt) {
      return { verified: false, error: "Transaction not found" };
    }

    if (receipt.status !== "success") {
      return { verified: false, error: "Transaction failed" };
    }

    // Look for Transfer event from USDC contract
    const transferLog = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === usdcAddress.toLowerCase() &&
        log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" // Transfer event signature
    );

    if (!transferLog) {
      return { verified: false, error: "No USDC transfer found in transaction" };
    }

    // Decode the transfer event
    const from = `0x${transferLog.topics[1]?.slice(26)}` as `0x${string}`;
    const to = `0x${transferLog.topics[2]?.slice(26)}` as `0x${string}`;
    const value = transferLog.data ? BigInt(transferLog.data) : BigInt(0);
    const actualAmount = fromUSDCUnits(value);

    // Verify sender, recipient, and amount
    const senderMatch = from.toLowerCase() === expectedFrom.toLowerCase();
    const recipientMatch = to.toLowerCase() === expectedTo.toLowerCase();
    const expectedUnits = toUSDCUnits(expectedAmount);
    const amountMatch = value >= expectedUnits;

    if (!senderMatch) {
      return {
        verified: false,
        actualFrom: from,
        actualTo: to,
        actualAmount,
        error: `Sender mismatch: expected ${expectedFrom}, got ${from}`,
      };
    }

    if (!recipientMatch) {
      return {
        verified: false,
        actualFrom: from,
        actualTo: to,
        actualAmount,
        error: `Recipient mismatch: expected ${expectedTo}, got ${to}`,
      };
    }

    if (!amountMatch) {
      return {
        verified: false,
        actualFrom: from,
        actualTo: to,
        actualAmount,
        error: `Amount insufficient: expected ${expectedAmount} USDC, got ${actualAmount} USDC`,
      };
    }

    return {
      verified: true,
      actualFrom: from,
      actualTo: to,
      actualAmount,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate x402 payment requirement payload.
 *
 * This is included in the 402 response to tell the client what payment is needed.
 */
export function generatePaymentRequirement(
  payTo: `0x${string}`,
  amount: number,
  jobId: string,
  description: string
): {
  payTo: string;
  amount: string;
  asset: string;
  chain: string;
  chainId: number;
  description: string;
  metadata: { jobId: string };
} {
  return {
    payTo,
    amount: toUSDCUnits(amount).toString(),
    asset: getUSDCAddress(),
    chain: X402_CONFIG.network,
    chainId: X402_CONFIG.chainId,
    description,
    metadata: { jobId },
  };
}
