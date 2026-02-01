import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { createServerClient } from "../lib/supabase.js";

const CompleteSchema = z.object({
  job_id: z.string().uuid("Invalid job_id format"),
  proof_text: z.string().min(1).max(10000),
});

export async function completeRoutes(fastify: FastifyInstance) {
  /**
   * POST /complete
   * Submit job completion proof
   */
  fastify.post("/complete", async (request: FastifyRequest, reply: FastifyReply) => {
    const agent = request.agent!;

    const validation = CompleteSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { job_id, proof_text } = validation.data;

    const supabase = createServerClient();

    // Check job exists and caller is the hired agent
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return reply.code(404).send({ error: "Job not found" });
    }

    if (job.hired_id !== agent.id) {
      return reply.code(403).send({
        error: "Only the hired agent can submit completion",
      });
    }

    if (job.status !== "in_progress") {
      return reply.code(400).send({
        error: `Cannot complete a job with status '${job.status}'. Job must be 'in_progress'.`,
      });
    }

    // Check for existing completion
    const { data: existingCompletion } = await supabase
      .from("completions")
      .select("id")
      .eq("job_id", job_id)
      .single();

    if (existingCompletion) {
      return reply.code(400).send({
        error: "Completion has already been submitted for this job",
      });
    }

    // Create completion
    const { data: completion, error } = await supabase
      .from("completions")
      .insert({
        job_id,
        agent_id: agent.id,
        proof_text,
        submitted_at: new Date().toISOString(),
        approved: null,
        reviewed_at: null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating completion:", error);
      return reply.code(500).send({ error: "Failed to submit completion" });
    }

    return reply.code(201).send({
      id: completion.id,
      job_id: completion.job_id,
      proof_text: completion.proof_text,
      submitted_at: completion.submitted_at,
      message: "Completion submitted. Awaiting poster approval.",
    });
  });
}
