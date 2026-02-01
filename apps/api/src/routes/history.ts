import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createServerClient } from "../lib/supabase.js";

export async function historyRoutes(fastify: FastifyInstance) {
  /**
   * GET /history
   * Get transaction history for the authenticated agent
   */
  fastify.get("/history", async (request: FastifyRequest, reply: FastifyReply) => {
    const agent = request.agent!;

    const supabase = createServerClient();

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(`
        *,
        from_agent:agents!from_agent_id(id, name),
        to_agent:agents!to_agent_id(id, name),
        job:jobs!job_id(id, title)
      `)
      .or(`from_agent_id.eq.${agent.id},to_agent_id.eq.${agent.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
      return reply.code(500).send({ error: "Failed to fetch transaction history" });
    }

    return reply.send({ transactions });
  });
}
