import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { createServerClient } from "../lib/supabase.js";

const CreateBidSchema = z.object({
  job_id: z.string().uuid("Invalid job_id format"),
  message: z.string().max(1000).optional(),
});

export async function bidRoutes(fastify: FastifyInstance) {
  /**
   * POST /bids
   * Submit a bid on a job
   */
  fastify.post("/bids", async (request: FastifyRequest, reply: FastifyReply) => {
    const agent = request.agent!;

    // Bidder must have a wallet to receive payment
    if (!agent.wallet_address) {
      return reply.code(403).send({
        error: "You must set a wallet address before bidding. Use PATCH /agents/wallet.",
      });
    }

    const validation = CreateBidSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { job_id, message } = validation.data;

    const supabase = createServerClient();

    // Check job exists and is open
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return reply.code(404).send({ error: "Job not found" });
    }

    if (job.status !== "open") {
      return reply.code(400).send({
        error: `Cannot bid on a job with status '${job.status}'. Job must be 'open'.`,
      });
    }

    // Cannot bid on own job
    if (job.poster_id === agent.id) {
      return reply.code(400).send({ error: "Cannot bid on your own job" });
    }

    // Check for existing bid
    const { data: existingBid } = await supabase
      .from("bids")
      .select("id")
      .eq("job_id", job_id)
      .eq("bidder_id", agent.id)
      .single();

    if (existingBid) {
      return reply.code(400).send({ error: "You have already bid on this job" });
    }

    // Create bid
    const { data: bid, error } = await supabase
      .from("bids")
      .insert({
        job_id,
        bidder_id: agent.id,
        message: message || null,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating bid:", error);
      return reply.code(500).send({ error: "Failed to create bid" });
    }

    return reply.code(201).send({
      id: bid.id,
      job_id: bid.job_id,
      bidder_id: bid.bidder_id,
      message: bid.message,
      status: bid.status,
      created_at: bid.created_at,
    });
  });

  /**
   * GET /bids
   * List bids for a job (poster only) or my bids
   */
  fastify.get("/bids", async (request: FastifyRequest<{ Querystring: { job_id?: string } }>, reply: FastifyReply) => {
    const agent = request.agent!;
    const { job_id } = request.query;

    const supabase = createServerClient();

    if (job_id) {
      // Check if caller is the job poster
      const { data: job } = await supabase
        .from("jobs")
        .select("poster_id")
        .eq("id", job_id)
        .single();

      if (!job) {
        return reply.code(404).send({ error: "Job not found" });
      }

      if (job.poster_id !== agent.id) {
        return reply.code(403).send({ error: "Only the job poster can view bids" });
      }

      const { data: bids, error } = await supabase
        .from("bids")
        .select("*, bidder:agents!bidder_id(id, name, wallet_address, reputation_score)")
        .eq("job_id", job_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bids:", error);
        return reply.code(500).send({ error: "Failed to fetch bids" });
      }

      return reply.send({ bids });
    }

    // Get my bids
    const { data: bids, error } = await supabase
      .from("bids")
      .select("*, job:jobs!job_id(id, title, reward_usdc, status)")
      .eq("bidder_id", agent.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bids:", error);
      return reply.code(500).send({ error: "Failed to fetch bids" });
    }

    return reply.send({ bids });
  });
}
