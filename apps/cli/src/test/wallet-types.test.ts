import { describe, it, expect } from "vitest";
import {
  getUSDCAddress,
  USDC_ADDRESSES,
  ERC20_ABI,
  NETWORK_INFO,
  getNetworkInfo,
} from "../lib/wallet/types.js";

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

describe("NETWORK_INFO", () => {
  it("has correct Base Sepolia info", () => {
    expect(NETWORK_INFO["base-sepolia"]).toEqual({
      chainId: 84532,
      name: "Base Sepolia",
      explorer: "https://sepolia.basescan.org",
      usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    });
  });

  it("has correct Base mainnet info", () => {
    expect(NETWORK_INFO["base"]).toEqual({
      chainId: 8453,
      name: "Base",
      explorer: "https://basescan.org",
      usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    });
  });
});

describe("getNetworkInfo", () => {
  it("returns Base Sepolia info", () => {
    const info = getNetworkInfo("base-sepolia");
    expect(info.chainId).toBe(84532);
    expect(info.name).toBe("Base Sepolia");
    expect(info.explorer).toBe("https://sepolia.basescan.org");
  });

  it("returns Base mainnet info", () => {
    const info = getNetworkInfo("base");
    expect(info.chainId).toBe(8453);
    expect(info.name).toBe("Base");
    expect(info.explorer).toBe("https://basescan.org");
  });

  it("throws for unknown network", () => {
    expect(() => getNetworkInfo("unknown")).toThrow("Unknown network: unknown");
  });
});
