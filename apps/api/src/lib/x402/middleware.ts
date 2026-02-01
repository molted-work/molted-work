/**
 * x402 Middleware for Fastify
 *
 * Handles the x402 payment flow:
 * 1. Check for PAYMENT-SIGNATURE header
 * 2. If missing, return 402 with payment requirements
 * 3. If present, verify the payment signature/receipt
 */

import { FastifyReply } from "fastify";
import { X402_HEADERS, X402_CONFIG, getUSDCAddress } from "./config.js";
import { generatePaymentRequirement, verifyPaymentOnChain, toUSDCUnits } from "./payment.js";

export type PaymentRequirementParams = {
  payTo: `0x${string}`;
  amount: number;
  jobId: string;
  description: string;
};

/**
 * Create a 402 Payment Required response with x402 headers.
 */
export function sendPaymentRequired(
  reply: FastifyReply,
  params: PaymentRequirementParams
): FastifyReply {
  const requirement = generatePaymentRequirement(
    params.payTo,
    params.amount,
    params.jobId,
    params.description
  );

  return reply
    .code(402)
    .header(X402_HEADERS.PAYMENT_REQUIRED, JSON.stringify(requirement))
    .send({
      error: "Payment required",
      message: `Payment of ${params.amount} USDC required to ${params.payTo}`,
      payment: requirement,
    });
}

/**
 * Parse the payment header from a request.
 *
 * The header can contain either:
 * - A transaction hash for on-chain verification
 * - A signed payment receipt from the facilitator
 */
export function parsePaymentHeader(
  paymentHeader: string | undefined
): { type: "tx_hash"; value: `0x${string}` } | { type: "receipt"; value: string } | null {
  if (!paymentHeader) {
    return null;
  }

  // Check if it's a transaction hash (0x + 64 hex chars)
  if (/^0x[a-fA-F0-9]{64}$/.test(paymentHeader)) {
    return { type: "tx_hash", value: paymentHeader as `0x${string}` };
  }

  // Otherwise, treat as a receipt
  return { type: "receipt", value: paymentHeader };
}

/**
 * Verify a payment using the facilitator service.
 *
 * This is used when the client provides a signed receipt from the facilitator.
 */
export async function verifyPaymentWithFacilitator(
  receipt: string,
  expectedPayTo: `0x${string}`,
  expectedAmount: number
): Promise<{
  verified: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${X402_CONFIG.facilitatorUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receipt,
        expected: {
          payTo: expectedPayTo,
          amount: toUSDCUnits(expectedAmount).toString(),
          asset: getUSDCAddress(),
          chainId: X402_CONFIG.chainId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { verified: false, error: `Facilitator error: ${error}` };
    }

    const result = await response.json() as { verified?: boolean; txHash?: string; error?: string };
    return {
      verified: result.verified === true,
      txHash: result.txHash,
      error: result.error,
    };
  } catch (error) {
    console.error("Facilitator verification error:", error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Full payment verification flow.
 *
 * Supports both direct transaction hash verification and facilitator receipt verification.
 */
export async function verifyPayment(
  paymentHeader: string | undefined,
  expectedFrom: `0x${string}`,
  expectedTo: `0x${string}`,
  expectedAmount: number
): Promise<{
  verified: boolean;
  txHash?: string;
  error?: string;
}> {
  const payment = parsePaymentHeader(paymentHeader);

  if (!payment) {
    return { verified: false, error: "No payment header provided" };
  }

  if (payment.type === "tx_hash") {
    const result = await verifyPaymentOnChain(
      payment.value,
      expectedFrom,
      expectedTo,
      expectedAmount
    );

    return {
      verified: result.verified,
      txHash: payment.value,
      error: result.error,
    };
  }

  // Receipt verification via facilitator
  const result = await verifyPaymentWithFacilitator(
    payment.value,
    expectedTo,
    expectedAmount
  );

  return result;
}
