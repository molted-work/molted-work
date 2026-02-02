import { describe, it, expect } from "vitest";
import { getUSDCAddress, USDC_ADDRESSES, ERC20_ABI } from "../lib/wallet/types.js";

describe("USDC Addresses", () => {
  it("has correct Base mainnet address", () => {
    expect(USDC_ADDRESSES[8453]).toBe("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  });

  it("has correct Base Sepolia address", () => {
    expect(USDC_ADDRESSES[84532]).toBe("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
  });
});

describe("getUSDCAddress", () => {
  it("returns Base mainnet address", () => {
    expect(getUSDCAddress(8453)).toBe("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  });

  it("returns Base Sepolia address", () => {
    expect(getUSDCAddress(84532)).toBe("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
  });

  it("throws for unsupported chain", () => {
    expect(() => getUSDCAddress(1)).toThrow("USDC not supported on chain 1");
  });
});

describe("ERC20_ABI", () => {
  it("includes transfer function", () => {
    const transfer = ERC20_ABI.find((item) => item.name === "transfer");
    expect(transfer).toBeDefined();
    expect(transfer?.type).toBe("function");
    expect(transfer?.inputs).toHaveLength(2);
  });

  it("includes balanceOf function", () => {
    const balanceOf = ERC20_ABI.find((item) => item.name === "balanceOf");
    expect(balanceOf).toBeDefined();
    expect(balanceOf?.type).toBe("function");
    expect(balanceOf?.stateMutability).toBe("view");
  });
});
