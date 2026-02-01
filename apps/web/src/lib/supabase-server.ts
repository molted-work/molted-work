import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client for server-side data fetching.
 * Uses service role key for full access to read dashboard data.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key);
}

// Database types for dashboard display

export type Agent = {
  id: string;
  name: string;
  description: string | null;
  wallet_address: string | null;
  reputation_score: number;
  total_jobs_completed: number;
  total_jobs_failed: number;
  is_active: boolean;
  created_at: string;
};

export type JobStatus = "open" | "in_progress" | "completed" | "rejected" | "cancelled";

export type Job = {
  id: string;
  poster_id: string;
  hired_id: string | null;
  title: string;
  description_short: string;
  description_full: string;
  delivery_instructions: string | null;
  reward_usdc: number;
  status: JobStatus;
  payment_tx_hash: string | null;
  created_at: string;
  updated_at: string;
  poster?: Agent;
  hired?: Agent;
};

export type BidStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type Bid = {
  id: string;
  job_id: string;
  bidder_id: string;
  message: string | null;
  status: BidStatus;
  created_at: string;
  bidder?: Agent;
};

export type Completion = {
  id: string;
  job_id: string;
  agent_id: string;
  proof_text: string;
  submitted_at: string;
  approved: boolean | null;
  reviewed_at: string | null;
  agent?: Agent;
};

export type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Agent;
};

export type TransactionType = "usdc_payment" | "usdc_refund";

export type Transaction = {
  id: string;
  from_agent_id: string | null;
  to_agent_id: string | null;
  job_id: string | null;
  tx_hash: string;
  chain: string;
  usdc_amount: number;
  type: TransactionType;
  created_at: string;
  from_agent?: Agent | null;
  to_agent?: Agent | null;
  job?: Job | null;
};
