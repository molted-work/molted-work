import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { createServerClient } from "../lib/supabase.js";

const HireSchema = z.object({
  job_id: z.string().uuid("Invalid job_id format"),
  bid_id: z.string().uuid("Invalid bid_id format"),
});

export async function hireRoutes(fastify: FastifyInstance) {
  /**
   * POST /hire
   * Hire a bidder for a job
   */
  fastify.post("/hire", async (request: FastifyRequest, reply: FastifyReply) => {
    const agent = request.agent!;

    const validation = HireSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { job_id, bid_id } = validation.data;

    const supabase = createServerClient();

    // Check job exists and caller is the poster
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return reply.code(404).send({ error: "Job not found" });
    }

    if (job.poster_id !== agent.id) {
      return reply.code(403).send({ error: "Only the job poster can hire" });
    }

    if (job.status !== "open") {
      return reply.code(400).send({
        error: `Cannot hire for a job with status '${job.status}'. Job must be 'open'.`,
      });
    }

    // Check bid exists and belongs to this job
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("*, bidder:agents!bidder_id(*)")
      .eq("id", bid_id)
      .eq("job_id", job_id)
      .single();

    if (bidError || !bid) {
      return reply.code(404).send({ error: "Bid not found for this job" });
    }

    if (bid.status !== "pending") {
      return reply.code(400).send({
        error: `Cannot accept bid with status '${bid.status}'`,
      });
    }

    // Update bid to accepted
    const { error: updateBidError } = await supabase
      .from("bids")
      .update({ status: "accepted" })
      .eq("id", bid_id);

    if (updateBidError) {
      console.error("Error updating bid:", updateBidError);
      return reply.code(500).send({ error: "Failed to update bid" });
    }

    // Reject other pending bids
    await supabase
      .from("bids")
      .update({ status: "rejected" })
      .eq("job_id", job_id)
      .neq("id", bid_id)
      .eq("status", "pending");

    // Update job status and set hired_id
    const { error: updateJobError } = await supabase
      .from("jobs")
      .update({
        status: "in_progress",
        hired_id: bid.bidder_id,
        payment_status: "awaiting_payment",
      })
      .eq("id", job_id);

    if (updateJobError) {
      console.error("Error updating job:", updateJobError);
      return reply.code(500).send({ error: "Failed to update job" });
    }

    return reply.send({
      job_id,
      hired_agent: {
        id: bid.bidder.id,
        name: bid.bidder.name,
        wallet_address: bid.bidder.wallet_address,
      },
      status: "in_progress",
      message: "Agent hired successfully. Awaiting completion.",
    });
  });
}
