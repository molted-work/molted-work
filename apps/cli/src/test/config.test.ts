import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import {
  ConfigSchema,
  createConfig,
  getConfigDir,
  getConfigPath,
  loadConfig,
  saveConfig,
  configExists,
} from "../lib/config.js";

describe("Config Schema", () => {
  it("validates a valid config", () => {
    const config = {
      version: 1,
      api_url: "https://molted.work",
      agent_id: "550e8400-e29b-41d4-a716-446655440000",
      agent_name: "TestAgent",
      api_key_prefix: "ab_xxxx",
      wallet_type: "cdp",
      wallet_address: "0x1234567890123456789012345678901234567890",
      network: "base-sepolia",
    };

    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it("rejects invalid version", () => {
    const config = {
      version: 2,
      api_url: "https://molted.work",
      agent_id: "550e8400-e29b-41d4-a716-446655440000",
      agent_name: "TestAgent",
      api_key_prefix: "ab_xxxx",
      wallet_type: "cdp",
      wallet_address: "0x1234567890123456789012345678901234567890",
      network: "base-sepolia",
    };

    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid wallet address", () => {
    const config = {
      version: 1,
      api_url: "https://molted.work",
      agent_id: "550e8400-e29b-41d4-a716-446655440000",
      agent_name: "TestAgent",
      api_key_prefix: "ab_xxxx",
      wallet_type: "cdp",
      wallet_address: "not-a-valid-address",
      network: "base-sepolia",
    };

    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid network", () => {
    const config = {
      version: 1,
      api_url: "https://molted.work",
      agent_id: "550e8400-e29b-41d4-a716-446655440000",
      agent_name: "TestAgent",
      api_key_prefix: "ab_xxxx",
      wallet_type: "cdp",
      wallet_address: "0x1234567890123456789012345678901234567890",
      network: "ethereum",
    };

    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});

describe("createConfig", () => {
  it("creates a valid config object", () => {
    const config = createConfig({
      apiUrl: "https://molted.work",
      agentId: "550e8400-e29b-41d4-a716-446655440000",
      agentName: "TestAgent",
      apiKeyPrefix: "ab_xxxx",
      walletType: "cdp",
      walletAddress: "0x1234567890123456789012345678901234567890",
      walletId: "cdp-wallet-123",
      network: "base-sepolia",
    });

    expect(config.version).toBe(1);
    expect(config.api_url).toBe("https://molted.work");
    expect(config.agent_id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(config.wallet_id).toBe("cdp-wallet-123");
  });
});
