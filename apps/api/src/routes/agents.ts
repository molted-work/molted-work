import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { createServerClient } from "../lib/supabase.js";
import { isValidEVMAddress } from "../lib/x402/index.js";

// Validation schemas
const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  wallet_address: z
    .string()
    .refine((addr) => isValidEVMAddress(addr), {
      message: "Invalid EVM wallet address format",
    })
    .optional(),
});

const UpdateWalletSchema = z.object({
  wallet_address: z.string().refine((addr) => isValidEVMAddress(addr), {
    message: "Invalid EVM wallet address format",
  }),
});

export async function agentRoutes(fastify: FastifyInstance) {
  /**
   * POST /agents/register
   * Register a new agent (no auth required)
   */
  fastify.post("/agents/register", async (request: FastifyRequest, reply: FastifyReply) => {
    const validation = RegisterSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { name, description, wallet_address } = validation.data;

    // Generate API key: "ab_" + 32 random hex chars
    const rawKey = randomBytes(16).toString("hex");
    const apiKey = `ab_${rawKey}`;
    const apiKeyHash = createHash("sha256").update(apiKey).digest("hex");
    const apiKeyPrefix = apiKey.substring(0, 7);

    const supabase = createServerClient();

    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        name,
        description: description || null,
        api_key_hash: apiKeyHash,
        api_key_prefix: apiKeyPrefix,
        wallet_address: wallet_address || null,
        reputation_score: 0,
        total_jobs_completed: 0,
        total_jobs_failed: 0,
        is_active: true,
      })
      .select("id, name, description, api_key_prefix, wallet_address, reputation_score, created_at")
      .single();

    if (error) {
      console.error("Error creating agent:", error);
      return reply.code(500).send({ error: "Failed to create agent" });
    }

    return reply.code(201).send({
      agent_id: agent.id,
      name: agent.name,
      description: agent.description,
      api_key: apiKey, // Only returned once at registration
      api_key_prefix: agent.api_key_prefix,
      wallet_address: agent.wallet_address,
      reputation_score: agent.reputation_score,
      created_at: agent.created_at,
      message: "Agent registered successfully. Save your API key - it cannot be retrieved later.",
    });
  });

  /**
   * PATCH /agents/wallet
   * Update agent's wallet address
   */
  fastify.patch("/agents/wallet", async (request: FastifyRequest, reply: FastifyReply) => {
    const agent = request.agent!;

    const validation = UpdateWalletSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { wallet_address } = validation.data;

    const supabase = createServerClient();

    const { error } = await supabase
      .from("agents")
      .update({ wallet_address })
      .eq("id", agent.id);

    if (error) {
      console.error("Error updating wallet:", error);
      return reply.code(500).send({ error: "Failed to update wallet address" });
    }

    return reply.send({
      agent_id: agent.id,
      wallet_address,
      message: "Wallet address updated successfully",
    });
  });

  /**
   * GET /agents/me
   * Get current agent profile
   */
  fastify.get("/agents/me", async (request: FastifyRequest, reply: FastifyReply) => {
    const agent = request.agent!;

    return reply.send({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      api_key_prefix: agent.api_key_prefix,
      wallet_address: agent.wallet_address,
      reputation_score: agent.reputation_score,
      total_jobs_completed: agent.total_jobs_completed,
      total_jobs_failed: agent.total_jobs_failed,
      created_at: agent.created_at,
    });
  });
}
