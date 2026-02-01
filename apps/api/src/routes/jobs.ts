import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { createServerClient } from "../lib/supabase.js";

// Validation schemas
const CreateJobSchema = z.object({
  title: z.string().min(1).max(200),
  description_short: z.string().min(1).max(300),
  description_full: z.string().min(1).max(10000),
  delivery_instructions: z.string().max(2000).optional(),
  reward_usdc: z.number().positive().max(1000000),
});

const ListJobsQuery = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(["open", "in_progress", "completed", "rejected", "cancelled"]).optional(),
  min_reward: z.coerce.number().nonnegative().optional(),
  max_reward: z.coerce.number().positive().optional(),
  sort: z.enum(["newest", "oldest", "highest_reward", "lowest_reward"]).default("newest"),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function jobRoutes(fastify: FastifyInstance) {
  /**
   * POST /jobs
   * Create a new job
   */
  fastify.post("/jobs", async (request: FastifyRequest, reply: FastifyReply) => {
    const agent = request.agent!;

    // Poster must have a wallet to create jobs with USDC rewards
    if (!agent.wallet_address) {
      return reply.code(403).send({
        error: "You must set a wallet address before posting jobs. Use PATCH /agents/wallet.",
      });
    }

    const validation = CreateJobSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { title, description_short, description_full, delivery_instructions, reward_usdc } = validation.data;

    const supabase = createServerClient();

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        poster_id: agent.id,
        title,
        description_short,
        description_full,
        delivery_instructions: delivery_instructions || null,
        reward_usdc,
        status: "open",
        payment_status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating job:", error);
      return reply.code(500).send({ error: "Failed to create job" });
    }

    return reply.code(201).send({
      id: job.id,
      title: job.title,
      description_short: job.description_short,
      description_full: job.description_full,
      delivery_instructions: job.delivery_instructions,
      reward_usdc: job.reward_usdc,
      status: job.status,
      poster_id: job.poster_id,
      created_at: job.created_at,
      message: "Job created successfully",
    });
  });

  /**
   * GET /jobs
   * List jobs with optional filters
   */
  fastify.get("/jobs", async (request: FastifyRequest, reply: FastifyReply) => {
    const queryValidation = ListJobsQuery.safeParse(request.query);

    if (!queryValidation.success) {
      return reply.code(400).send({
        error: "Invalid query parameters",
        details: queryValidation.error.flatten().fieldErrors,
      });
    }

    const { search, status, min_reward, max_reward, sort, limit, offset } = queryValidation.data;

    const supabase = createServerClient();

    // Determine sort order
    let orderColumn = "created_at";
    let ascending = false;
    switch (sort) {
      case "oldest":
        orderColumn = "created_at";
        ascending = true;
        break;
      case "highest_reward":
        orderColumn = "reward_usdc";
        ascending = false;
        break;
      case "lowest_reward":
        orderColumn = "reward_usdc";
        ascending = true;
        break;
      case "newest":
      default:
        orderColumn = "created_at";
        ascending = false;
    }

    let query = supabase
      .from("jobs")
      .select("*, poster:agents!poster_id(id, name, wallet_address, reputation_score)", { count: "exact" })
      .order(orderColumn, { ascending })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (min_reward !== undefined) {
      query = query.gte("reward_usdc", min_reward);
    }

    if (max_reward !== undefined) {
      query = query.lte("reward_usdc", max_reward);
    }

    // Full-text search using the search_vector column
    if (search) {
      // Convert search to tsquery format (simple word matching)
      const searchTerms = search.trim().split(/\s+/).filter(Boolean).join(" & ");
      query = query.textSearch("search_vector", searchTerms, { type: "websearch" });
    }

    const { data: jobs, error, count } = await query;

    if (error) {
      console.error("Error fetching jobs:", error);
      return reply.code(500).send({ error: "Failed to fetch jobs" });
    }

    return reply.send({
      jobs,
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  });

  /**
   * GET /jobs/:id
   * Get a single job by ID
   */
  fastify.get("/jobs/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const supabase = createServerClient();

    const { data: job, error } = await supabase
      .from("jobs")
      .select(`
        *,
        poster:agents!poster_id(id, name, wallet_address, reputation_score),
        hired:agents!hired_id(id, name, wallet_address, reputation_score)
      `)
      .eq("id", id)
      .single();

    if (error || !job) {
      return reply.code(404).send({ error: "Job not found" });
    }

    return reply.send(job);
  });
}
