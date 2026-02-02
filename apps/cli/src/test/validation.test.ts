import { describe, it, expect } from "vitest";
import {
  evmAddressSchema,
  uuidSchema,
  jobStatusSchema,
  registerAgentSchema,
  createBidSchema,
  listJobsQuerySchema,
} from "../lib/validation.js";

describe("evmAddressSchema", () => {
  it("accepts valid EVM addresses", () => {
    const validAddresses = [
      "0x1234567890123456789012345678901234567890",
      "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
      "0xabcdef1234567890abcdef1234567890abcdef12",
    ];

    for (const address of validAddresses) {
      const result = evmAddressSchema.safeParse(address);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid addresses", () => {
    const invalidAddresses = [
      "not-an-address",
      "0x123", // Too short
      "0x12345678901234567890123456789012345678901", // Too long
      "1234567890123456789012345678901234567890", // Missing 0x
      "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // Invalid hex chars
    ];

    for (const address of invalidAddresses) {
      const result = evmAddressSchema.safeParse(address);
      expect(result.success).toBe(false);
    }
  });
});

describe("uuidSchema", () => {
  it("accepts valid UUIDs", () => {
    const validUUIDs = [
      "550e8400-e29b-41d4-a716-446655440000",
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    ];

    for (const uuid of validUUIDs) {
      const result = uuidSchema.safeParse(uuid);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid UUIDs", () => {
    const invalidUUIDs = ["not-a-uuid", "12345", ""];

    for (const uuid of invalidUUIDs) {
      const result = uuidSchema.safeParse(uuid);
      expect(result.success).toBe(false);
    }
  });
});

describe("jobStatusSchema", () => {
  it("accepts valid statuses", () => {
    const validStatuses = ["open", "in_progress", "completed", "rejected", "cancelled"];

    for (const status of validStatuses) {
      const result = jobStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid statuses", () => {
    const result = jobStatusSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("registerAgentSchema", () => {
  it("accepts valid registration input", () => {
    const input = {
      name: "TestAgent",
      description: "A test agent",
      wallet_address: "0x1234567890123456789012345678901234567890",
    };

    const result = registerAgentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts minimal registration input", () => {
    const input = {
      name: "TestAgent",
    };

    const result = registerAgentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const input = {
      name: "",
    };

    const result = registerAgentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects too long name", () => {
    const input = {
      name: "a".repeat(101),
    };

    const result = registerAgentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("createBidSchema", () => {
  it("accepts valid bid input", () => {
    const input = {
      job_id: "550e8400-e29b-41d4-a716-446655440000",
      message: "I can do this job!",
    };

    const result = createBidSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts bid without message", () => {
    const input = {
      job_id: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = createBidSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid job_id", () => {
    const input = {
      job_id: "not-a-uuid",
    };

    const result = createBidSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("listJobsQuerySchema", () => {
  it("provides defaults for optional fields", () => {
    const result = listJobsQuerySchema.parse({});
    expect(result.sort).toBe("newest");
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it("accepts all valid options", () => {
    const input = {
      search: "web scraping",
      status: "open",
      min_reward: 10,
      max_reward: 100,
      sort: "highest_reward",
      limit: 50,
      offset: 10,
    };

    const result = listJobsQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("web scraping");
      expect(result.data.status).toBe("open");
      expect(result.data.min_reward).toBe(10);
      expect(result.data.max_reward).toBe(100);
      expect(result.data.sort).toBe("highest_reward");
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(10);
    }
  });

  it("rejects too high limit", () => {
    const input = {
      limit: 101,
    };

    const result = listJobsQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
