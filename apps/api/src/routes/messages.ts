import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { createServerClient } from "../lib/supabase.js";

// Validation schemas
const SendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

const ListMessagesQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function messageRoutes(fastify: FastifyInstance) {
  /**
   * GET /jobs/:id/messages
   * Get messages for a job (only poster or hired agent can view)
   */
  fastify.get(
    "/jobs/:id/messages",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const agent = request.agent!;
      const { id: jobId } = request.params;

      const queryValidation = ListMessagesQuery.safeParse(request.query);
      if (!queryValidation.success) {
        return reply.code(400).send({
          error: "Invalid query parameters",
          details: queryValidation.error.flatten().fieldErrors,
        });
      }

      const { limit, offset } = queryValidation.data;
      const supabase = createServerClient();

      // Get the job to check authorization
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id, poster_id, hired_id, status")
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        return reply.code(404).send({ error: "Job not found" });
      }

      // Only poster or hired agent can view messages
      if (job.poster_id !== agent.id && job.hired_id !== agent.id) {
        return reply.code(403).send({
          error: "You can only view messages for jobs you posted or are working on",
        });
      }

      // Fetch messages with sender info
      const { data: messages, error, count } = await supabase
        .from("messages")
        .select("*, sender:agents!sender_id(id, name)", { count: "exact" })
        .eq("job_id", jobId)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching messages:", error);
        return reply.code(500).send({ error: "Failed to fetch messages" });
      }

      return reply.send({
        messages,
        pagination: {
          total: count,
          limit,
          offset,
        },
      });
    }
  );

  /**
   * POST /jobs/:id/messages
   * Send a message on a job (only poster or hired agent can send)
   */
  fastify.post(
    "/jobs/:id/messages",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const agent = request.agent!;
      const { id: jobId } = request.params;

      const validation = SendMessageSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        });
      }

      const { content } = validation.data;
      const supabase = createServerClient();

      // Get the job to check authorization
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id, poster_id, hired_id, status")
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        return reply.code(404).send({ error: "Job not found" });
      }

      // Only poster or hired agent can send messages
      if (job.poster_id !== agent.id && job.hired_id !== agent.id) {
        return reply.code(403).send({
          error: "You can only send messages for jobs you posted or are working on",
        });
      }

      // Job must be in_progress or completed to send messages
      if (!["in_progress", "completed"].includes(job.status)) {
        return reply.code(400).send({
          error: "Messages can only be sent on jobs that are in progress or completed",
        });
      }

      // Create the message
      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          job_id: jobId,
          sender_id: agent.id,
          content,
        })
        .select("*, sender:agents!sender_id(id, name)")
        .single();

      if (error) {
        console.error("Error creating message:", error);
        return reply.code(500).send({ error: "Failed to send message" });
      }

      return reply.code(201).send(message);
    }
  );
}
