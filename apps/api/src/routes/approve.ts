import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { createServerClient } from "../lib/supabase.js";
import {
  sendPaymentRequired,
  verifyPayment,
  X402_CONFIG,
  X402_HEADERS,
} from "../lib/x402/index.js";

const ApproveSchema = z.object({
  job_id: z.string().uuid("Invalid job_id format"),
  approved: z.boolean(),
});

/**
 * Calculate reputation score based on completed and failed jobs.
 * Formula: (completed*5 - failed*2) / max(1, completed + failed), clamped 0-5
 */
function calculateReputationScore(completed: number, failed: number): number {
  const total = Math.max(1, completed + failed);
  const rawScore = (completed * 5 - failed * 2) / total;
  return Math.max(0, Math.min(5, rawScore));
}

export async function approveRoutes(fastify: FastifyInstance) {
  /**
   * POST /approve
   *
   * Approve or reject a job completion with x402 payment flow.
   *
   * For approval:
   * 1. First call (no payment header) → Returns 402 Payment Required
   * 2. Agent makes USDC payment directly to worker wallet on Base
   * 3. Second call (with X-Payment header containing tx hash) → Verifies payment and marks job completed
   *
   * For rejection:
   * - No payment required, marks job as rejected
   */
  fastify.post("/approve", async (request: FastifyRequest, reply: FastifyReply) => {
    const agent = request.agent!;

    const validation = ApproveSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { job_id, approved } = validation.data;

    const supabase = createServerClient();

    // Check job exists, status='in_progress', caller is poster
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return reply.code(404).send({ error: "Job not found" });
    }

    if (job.status !== "in_progress") {
      return reply.code(400).send({
        error: `Cannot approve/reject a job with status '${job.status}'. Job must be 'in_progress'.`,
      });
    }

    if (job.poster_id !== agent.id) {
      return reply.code(403).send({
        error: "Only the job poster can approve or reject this job",
      });
    }

    // Check completion exists for this job
    const { data: completion, error: completionError } = await supabase
      .from("completions")
      .select("*")
      .eq("job_id", job_id)
      .single();

    if (completionError || !completion) {
      return reply.code(400).send({
        error: "No completion found for this job. The hired agent must submit a completion first.",
      });
    }

    if (completion.approved !== null) {
      return reply.code(400).send({
        error: "This completion has already been reviewed",
      });
    }

    // Get the hired agent's info (including wallet)
    const { data: hiredAgent, error: hiredAgentError } = await supabase
      .from("agents")
      .select("id, wallet_address, total_jobs_completed, total_jobs_failed")
      .eq("id", job.hired_id)
      .single();

    if (hiredAgentError || !hiredAgent) {
      console.error("Error fetching hired agent:", hiredAgentError);
      return reply.code(500).send({ error: "Failed to fetch hired agent" });
    }

    if (approved) {
      // === APPROVED FLOW WITH x402 ===

      // Check if worker has a wallet
      if (!hiredAgent.wallet_address) {
        return reply.code(400).send({
          error: "Hired agent does not have a wallet address set. Cannot process payment.",
        });
      }

      // Check if poster has a wallet
      if (!agent.wallet_address) {
        return reply.code(403).send({
          error: "You must have a wallet address set to approve and pay for jobs.",
        });
      }

      // Check for existing payment
      if (job.payment_status === "paid" && job.payment_tx_hash) {
        return reply.code(400).send({
          error: "Payment has already been processed for this job",
        });
      }

      // Get payment header
      const paymentHeader = request.headers[X402_HEADERS.PAYMENT_SIGNATURE] as string | undefined;

      // Try to verify payment from header
      const paymentResult = await verifyPayment(
        paymentHeader,
        agent.wallet_address as `0x${string}`,
        hiredAgent.wallet_address as `0x${string}`,
        job.reward_usdc
      );

      if (!paymentResult.verified) {
        // No valid payment - return 402 Payment Required
        return sendPaymentRequired(reply, {
          payTo: hiredAgent.wallet_address as `0x${string}`,
          amount: job.reward_usdc,
          jobId: job_id,
          description: `Payment for job: ${job.title}`,
        });
      }

      // Payment verified! Complete the job
      const txHash = paymentResult.txHash!;

      // Update completion: set approved and reviewed_at
      const { error: updateCompletionError } = await supabase
        .from("completions")
        .update({
          approved: true,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", completion.id);

      if (updateCompletionError) {
        console.error("Error updating completion:", updateCompletionError);
        return reply.code(500).send({ error: "Failed to update completion" });
      }

      // Update job status and payment info
      const { error: updateJobError } = await supabase
        .from("jobs")
        .update({
          status: "completed",
          payment_status: "paid",
          payment_tx_hash: txHash,
          payment_verified_at: new Date().toISOString(),
        })
        .eq("id", job_id);

      if (updateJobError) {
        console.error("Error updating job status:", updateJobError);
        return reply.code(500).send({ error: "Failed to update job status" });
      }

      // Update hired agent: increment total_jobs_completed, recalculate reputation
      const newCompleted = hiredAgent.total_jobs_completed + 1;
      const newReputationScore = calculateReputationScore(
        newCompleted,
        hiredAgent.total_jobs_failed
      );

      await supabase
        .from("agents")
        .update({
          total_jobs_completed: newCompleted,
          reputation_score: newReputationScore,
        })
        .eq("id", hiredAgent.id);

      // Record USDC payment transaction
      await supabase
        .from("transactions")
        .insert({
          from_agent_id: job.poster_id,
          to_agent_id: hiredAgent.id,
          job_id: job_id,
          tx_hash: txHash,
          chain: X402_CONFIG.network,
          usdc_amount: job.reward_usdc,
          type: "usdc_payment",
        });

      return reply.send({
        approved: true,
        job_id: job_id,
        payment_tx_hash: txHash,
        amount_usdc: job.reward_usdc,
        paid_to: hiredAgent.wallet_address,
        message: `Job approved and payment of ${job.reward_usdc} USDC verified on ${X402_CONFIG.network}.`,
      });
    } else {
      // === REJECTED FLOW ===
      // No payment needed for rejections

      // Update completion: set approved=false and reviewed_at
      const { error: updateCompletionError } = await supabase
        .from("completions")
        .update({
          approved: false,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", completion.id);

      if (updateCompletionError) {
        console.error("Error updating completion:", updateCompletionError);
        return reply.code(500).send({ error: "Failed to update completion" });
      }

      // Update job status='rejected', payment_status='failed'
      const { error: updateJobError } = await supabase
        .from("jobs")
        .update({
          status: "rejected",
          payment_status: "failed",
        })
        .eq("id", job_id);

      if (updateJobError) {
        console.error("Error updating job status:", updateJobError);
        return reply.code(500).send({ error: "Failed to update job status" });
      }

      // Update hired agent: increment total_jobs_failed, recalculate reputation
      const newFailed = hiredAgent.total_jobs_failed + 1;
      const newReputationScore = calculateReputationScore(
        hiredAgent.total_jobs_completed,
        newFailed
      );

      await supabase
        .from("agents")
        .update({
          total_jobs_failed: newFailed,
          reputation_score: newReputationScore,
        })
        .eq("id", hiredAgent.id);

      return reply.send({
        approved: false,
        job_id: job_id,
        message: "Job completion rejected. No payment processed.",
      });
    }
  });
}
