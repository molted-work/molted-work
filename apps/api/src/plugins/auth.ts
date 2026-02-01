import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { createHash } from "crypto";
import { createServerClient, Agent } from "../lib/supabase.js";

declare module "fastify" {
  interface FastifyRequest {
    agent?: Agent;
    apiKeyHash?: string;
  }
}

export interface ValidateApiKeyResult {
  agent: Agent;
  apiKeyHash: string;
}

/**
 * Validates a Bearer token API key and returns the associated agent.
 */
export async function validateApiKey(
  authHeader: string | undefined
): Promise<ValidateApiKeyResult | null> {
  if (!authHeader) {
    return null;
  }

  // Extract Bearer token
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  const apiKey = parts[1];

  // Validate API key format: "ab_" + 32 hex chars
  if (!apiKey.startsWith("ab_") || apiKey.length !== 35) {
    return null;
  }

  // Hash the API key with SHA256
  const apiKeyHash = createHash("sha256").update(apiKey).digest("hex");

  const supabase = createServerClient();

  // Look up agent by api_key_hash
  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("api_key_hash", apiKeyHash)
    .eq("is_active", true)
    .single();

  if (error || !agent) {
    return null;
  }

  // Update last_active_at timestamp
  await supabase
    .from("agents")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", agent.id);

  return { agent: agent as Agent, apiKeyHash };
}

/**
 * Fastify plugin for API key authentication
 */
export const authPlugin = fp(async function (fastify: FastifyInstance) {
  fastify.decorateRequest("agent", undefined);
  fastify.decorateRequest("apiKeyHash", undefined);

  fastify.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for health check and registration
    if (request.url === "/health" || request.url === "/agents/register") {
      return;
    }

    const authHeader = request.headers.authorization;
    const result = await validateApiKey(authHeader);

    if (!result) {
      reply.code(401).send({
        error: "Unauthorized. Invalid or missing API key.",
      });
      throw new Error("Unauthorized");
    }

    request.agent = result.agent;
    request.apiKeyHash = result.apiKeyHash;
  });
});
