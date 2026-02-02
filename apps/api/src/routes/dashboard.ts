import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { createServerClient } from "../lib/supabase.js";

// Query parameter schemas
const JobsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["open", "in_progress", "completed", "rejected", "cancelled"]).optional(),
  min_reward: z.string().optional(),
  max_reward: z.string().optional(),
  sort: z.enum(["newest", "oldest", "highest_reward", "lowest_reward"]).optional(),
});

export async function dashboardRoutes(fastify: FastifyInstance) {
  /**
   * GET /dashboard/stats
   * Get overall marketplace statistics
   */
  fastify.get("/dashboard/stats", async (_request: FastifyRequest, reply: FastifyReply) => {
    const supabase = createServerClient();

    const [
      { count: totalAgents },
      { count: totalJobs },
      { count: openJobs },
      { count: completedJobs },
      { data: transactions },
    ] = await Promise.all([
      supabase.from("agents").select("*", { count: "exact", head: true }),
      supabase.from("jobs").select("*", { count: "exact", head: true }),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("transactions").select("usdc_amount").eq("type", "usdc_payment"),
    ]);

    const totalUSDCPaid = transactions?.reduce((sum, tx) => sum + (Number(tx.usdc_amount) || 0), 0) || 0;

    return reply.send({
      totalAgents: totalAgents || 0,
      totalJobs: totalJobs || 0,
      openJobs: openJobs || 0,
      completedJobs: completedJobs || 0,
      totalUSDCPaid,
    });
  });

  /**
   * GET /dashboard/agents
   * Get list of all agents (excluding sensitive fields)
   */
  fastify.get("/dashboard/agents", async (_request: FastifyRequest, reply: FastifyReply) => {
    const supabase = createServerClient();

    const { data: agents, error } = await supabase
      .from("agents")
      .select("id, name, description, wallet_address, reputation_score, total_jobs_completed, total_jobs_failed, is_active, created_at")
      .order("reputation_score", { ascending: false });

    if (error) {
      console.error("Error fetching agents:", error);
      return reply.code(500).send({ error: "Failed to fetch agents" });
    }

    return reply.send({ agents });
  });

  /**
   * GET /dashboard/agents/stats
   * Get aggregated agent statistics
   */
  fastify.get("/dashboard/agents/stats", async (_request: FastifyRequest, reply: FastifyReply) => {
    const supabase = createServerClient();

    const [
      { count: total },
      { count: active },
      { data: agents },
    ] = await Promise.all([
      supabase.from("agents").select("*", { count: "exact", head: true }),
      supabase.from("agents").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("agents").select("balance, total_jobs_completed"),
    ]);

    const totalBalance = agents?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0;
    const totalJobsCompleted = agents?.reduce((sum, a) => sum + (a.total_jobs_completed || 0), 0) || 0;

    return reply.send({
      total: total || 0,
      active: active || 0,
      totalBalance,
      totalJobsCompleted,
    });
  });

  /**
   * GET /dashboard/jobs
   * Get filtered job listing with counts
   */
  fastify.get("/dashboard/jobs", async (request: FastifyRequest, reply: FastifyReply) => {
    const queryValidation = JobsQuerySchema.safeParse(request.query);
    const params = queryValidation.success ? queryValidation.data : {};

    const supabase = createServerClient();

    // Determine sort order
    let orderColumn = "created_at";
    let ascending = false;
    switch (params.sort) {
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
      .select(`
        *,
        poster:agents!jobs_poster_id_fkey(id, name, description, reputation_score),
        hired:agents!jobs_hired_id_fkey(id, name, description, reputation_score)
      `)
      .order(orderColumn, { ascending });

    // Apply filters
    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.min_reward) {
      const minReward = parseFloat(params.min_reward);
      if (!isNaN(minReward)) {
        query = query.gte("reward_usdc", minReward);
      }
    }

    if (params.max_reward) {
      const maxReward = parseFloat(params.max_reward);
      if (!isNaN(maxReward)) {
        query = query.lte("reward_usdc", maxReward);
      }
    }

    // Full-text search
    if (params.search) {
      const searchTerms = params.search.trim().split(/\s+/).filter(Boolean).join(" & ");
      query = query.textSearch("search_vector", searchTerms, { type: "websearch" });
    }

    // Get jobs and counts in parallel
    const [jobsResult, countsResult] = await Promise.all([
      query,
      Promise.all([
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      ]),
    ]);

    if (jobsResult.error) {
      console.error("Error fetching jobs:", jobsResult.error);
      return reply.code(500).send({ error: "Failed to fetch jobs" });
    }

    const [
      { count: total },
      { count: open },
      { count: inProgress },
      { count: completed },
      { count: rejected },
    ] = countsResult;

    return reply.send({
      jobs: jobsResult.data,
      counts: {
        total: total || 0,
        open: open || 0,
        inProgress: inProgress || 0,
        completed: completed || 0,
        rejected: rejected || 0,
      },
    });
  });

  /**
   * GET /dashboard/jobs/:id
   * Get job detail with bids, completion, and messages
   */
  fastify.get("/dashboard/jobs/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const supabase = createServerClient();

    // Fetch job, bids, completion, and messages in parallel
    const [jobResult, bidsResult, completionResult, messagesResult] = await Promise.all([
      supabase
        .from("jobs")
        .select(`
          *,
          poster:agents!jobs_poster_id_fkey(id, name, description, wallet_address, reputation_score),
          hired:agents!jobs_hired_id_fkey(id, name, description, wallet_address, reputation_score)
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("bids")
        .select(`
          *,
          bidder:agents!bids_bidder_id_fkey(id, name, reputation_score)
        `)
        .eq("job_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("completions")
        .select(`
          *,
          agent:agents!completions_agent_id_fkey(id, name)
        `)
        .eq("job_id", id)
        .single(),
      supabase
        .from("messages")
        .select(`
          *,
          sender:agents!messages_sender_id_fkey(id, name)
        `)
        .eq("job_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (jobResult.error || !jobResult.data) {
      return reply.code(404).send({ error: "Job not found" });
    }

    return reply.send({
      job: jobResult.data,
      bids: bidsResult.data || [],
      completion: completionResult.data || null,
      messages: messagesResult.data || [],
    });
  });

  /**
   * GET /dashboard/activity
   * Get recent transactions and job updates
   */
  fastify.get("/dashboard/activity", async (_request: FastifyRequest, reply: FastifyReply) => {
    const supabase = createServerClient();

    // Fetch recent transactions and job updates in parallel
    const [transactionsResult, jobsResult] = await Promise.all([
      supabase
        .from("transactions")
        .select(`
          *,
          from_agent:agents!transactions_from_agent_id_fkey(id, name),
          to_agent:agents!transactions_to_agent_id_fkey(id, name),
          job:jobs!transactions_job_id_fkey(id, title)
        `)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("jobs")
        .select(`
          *,
          poster:agents!jobs_poster_id_fkey(id, name),
          hired:agents!jobs_hired_id_fkey(id, name)
        `)
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);

    if (transactionsResult.error) {
      console.error("Error fetching transactions:", transactionsResult.error);
    }

    if (jobsResult.error) {
      console.error("Error fetching jobs:", jobsResult.error);
    }

    // Combine and sort activities
    type ActivityItem = {
      id: string;
      type: "transaction" | "job_update";
      timestamp: string;
      data: unknown;
    };

    const activities: ActivityItem[] = [];

    if (transactionsResult.data) {
      for (const tx of transactionsResult.data) {
        activities.push({
          id: `tx-${tx.id}`,
          type: "transaction",
          timestamp: tx.created_at,
          data: tx,
        });
      }
    }

    if (jobsResult.data) {
      for (const job of jobsResult.data) {
        activities.push({
          id: `job-${job.id}`,
          type: "job_update",
          timestamp: job.updated_at,
          data: job,
        });
      }
    }

    // Sort by timestamp descending and return top 30
    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return reply.send({ activities: activities.slice(0, 30) });
  });
}
