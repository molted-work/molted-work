import { describe, it, expect } from "vitest";
import {
  parseUSDCAmount,
  formatUSDCAmount,
  toUSDCUnits,
  fromUSDCUnits,
  validatePaymentRequirement,
  isPaymentRequired,
} from "../lib/x402/client.js";
import type { PaymentRequiredResponse } from "../lib/api-client.js";

describe("USDC amount utilities", () => {
  describe("parseUSDCAmount", () => {
    it("parses string amounts to bigint", () => {
      expect(parseUSDCAmount("1000000")).toBe(BigInt(1000000));
      expect(parseUSDCAmount("25000000")).toBe(BigInt(25000000));
    });
  });

  describe("formatUSDCAmount", () => {
    it("formats bigint to human readable", () => {
      expect(formatUSDCAmount(BigInt(1000000))).toBe("1.00");
      expect(formatUSDCAmount(BigInt(25000000))).toBe("25.00");
      expect(formatUSDCAmount(BigInt(12345678))).toBe("12.35");
    });
  });

  describe("toUSDCUnits", () => {
    it("converts decimal to base units", () => {
      expect(toUSDCUnits(1)).toBe(BigInt(1000000));
      expect(toUSDCUnits(25)).toBe(BigInt(25000000));
      expect(toUSDCUnits(10.5)).toBe(BigInt(10500000));
    });
  });

  describe("fromUSDCUnits", () => {
    it("converts base units to decimal", () => {
      expect(fromUSDCUnits(BigInt(1000000))).toBe(1);
      expect(fromUSDCUnits(BigInt(25000000))).toBe(25);
      expect(fromUSDCUnits(BigInt(10500000))).toBe(10.5);
    });
  });
});

describe("validatePaymentRequirement", () => {
  it("validates a correct payment requirement", () => {
    const response: PaymentRequiredResponse = {
      error: "Payment required",
      message: "Payment of 25 USDC required",
      payment: {
        payTo: "0x1234567890123456789012345678901234567890",
        amount: "25000000",
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        chain: "base-sepolia",
        chainId: 84532,
        description: "Payment for job",
        metadata: { jobId: "test-job-id" },
      },
    };

    const result = validatePaymentRequirement(response);
    expect(result.payTo).toBe("0x1234567890123456789012345678901234567890");
    expect(result.amount).toBe("25000000");
    expect(result.chainId).toBe(84532);
  });

  it("throws for invalid payTo address", () => {
    const response: PaymentRequiredResponse = {
      error: "Payment required",
      message: "Payment required",
      payment: {
        payTo: "invalid-address",
        amount: "25000000",
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        chain: "base-sepolia",
        chainId: 84532,
        description: "Payment for job",
        metadata: { jobId: "test-job-id" },
      },
    };

    expect(() => validatePaymentRequirement(response)).toThrow("invalid payTo address");
  });

  it("throws for invalid amount", () => {
    const response: PaymentRequiredResponse = {
      error: "Payment required",
      message: "Payment required",
      payment: {
        payTo: "0x1234567890123456789012345678901234567890",
        amount: "not-a-number",
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        chain: "base-sepolia",
        chainId: 84532,
        description: "Payment for job",
        metadata: { jobId: "test-job-id" },
      },
    };

    expect(() => validatePaymentRequirement(response)).toThrow("invalid amount");
  });
});

describe("isPaymentRequired", () => {
  it("returns true for payment required response", () => {
    const response = {
      error: "Payment required",
      message: "Payment required",
      payment: {
        payTo: "0x1234567890123456789012345678901234567890",
        amount: "25000000",
        chainId: 84532,
      },
    };

    expect(isPaymentRequired(response)).toBe(true);
  });

  it("returns false for success response", () => {
    const response = {
      approved: true,
      job_id: "test-job-id",
      payment_tx_hash: "0xabc123",
      message: "Job approved",
    };

    expect(isPaymentRequired(response)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isPaymentRequired(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isPaymentRequired(undefined)).toBe(false);
  });
});
