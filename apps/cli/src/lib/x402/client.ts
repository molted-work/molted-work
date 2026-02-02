/**
 * x402 Payment Flow Handler
 *
 * Handles the client-side of the x402 payment protocol:
 * 1. Receive 402 Payment Required with payment details
 * 2. Send USDC payment via wallet provider
 * 3. Retry request with payment transaction hash
 */

import type { PaymentRequirement, PaymentRequiredResponse } from "../api-client.js";
import type { WalletProvider } from "../wallet/types.js";
import { PaymentError } from "../errors.js";

// USDC has 6 decimals
const USDC_DECIMALS = 6;

/**
 * Parse USDC amount from string (base units) to bigint
 */
export function parseUSDCAmount(amount: string): bigint {
  return BigInt(amount);
}

/**
 * Format USDC amount from bigint to human readable
 */
export function formatUSDCAmount(amount: bigint): string {
  const num = Number(amount) / 10 ** USDC_DECIMALS;
  return num.toFixed(2);
}

/**
 * Convert USDC decimal to base units
 */
export function toUSDCUnits(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

/**
 * Convert USDC base units to decimal
 */
export function fromUSDCUnits(units: bigint): number {
  return Number(units) / 10 ** USDC_DECIMALS;
}

/**
 * Validate a payment requirement
 */
export function validatePaymentRequirement(
  response: PaymentRequiredResponse
): PaymentRequirement {
  const { payment } = response;

  if (!payment) {
    throw new PaymentError("Invalid payment requirement: missing payment details");
  }

  if (!payment.payTo || !/^0x[a-fA-F0-9]{40}$/.test(payment.payTo)) {
    throw new PaymentError("Invalid payment requirement: invalid payTo address");
  }

  if (!payment.amount || isNaN(Number(payment.amount))) {
    throw new PaymentError("Invalid payment requirement: invalid amount");
  }

  if (!payment.chainId) {
    throw new PaymentError("Invalid payment requirement: missing chainId");
  }

  return payment;
}

/**
 * Execute a payment using the wallet provider
 */
export async function executePayment(
  wallet: WalletProvider,
  requirement: PaymentRequirement
): Promise<`0x${string}`> {
  const amount = parseUSDCAmount(requirement.amount);
  const to = requirement.payTo as `0x${string}`;
  const chainId = requirement.chainId;

  // Check balance first
  const balance = await wallet.getUSDCBalance();
  if (balance < amount) {
    const needed = formatUSDCAmount(amount);
    const available = formatUSDCAmount(balance);
    throw new PaymentError(
      `Insufficient USDC balance. Need ${needed} USDC, have ${available} USDC.`
    );
  }

  // Send the payment
  const txHash = await wallet.sendUSDC({ to, amount, chainId });

  return txHash;
}

/**
 * Check if a response indicates payment is required
 */
export function isPaymentRequired(response: unknown): response is PaymentRequiredResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "payment" in response &&
    typeof (response as PaymentRequiredResponse).payment === "object"
  );
}
