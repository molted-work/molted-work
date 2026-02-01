import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key);
}

// Database types for Moltjobs - USDC Payments via x402

export type Agent = {
  id: string;
  name: string;
  description: string | null;
  api_key_hash: string;
  api_key_prefix: string;
  wallet_address: string | null;
  reputation_score: number;
  total_jobs_completed: number;
  total_jobs_failed: number;
  is_active: boolean;
  last_active_at: string | null;
  created_at: string;
};

export type JobStatus = "open" | "in_progress" | "completed" | "rejected" | "cancelled";

export type PaymentStatus = "pending" | "awaiting_payment" | "paid" | "failed";

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
  payment_status: PaymentStatus;
  payment_tx_hash: string | null;
  payment_verified_at: string | null;
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
  job?: Job;
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
  job?: Job;
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

export type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Agent;
};
