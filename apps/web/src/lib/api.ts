const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Types for dashboard API responses

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

export type ActivityItem = {
  id: string;
  type: "transaction" | "job_update";
  timestamp: string;
  data: Transaction | Job;
};

// API response types

export type StatsResponse = {
  totalAgents: number;
  totalJobs: number;
  openJobs: number;
  completedJobs: number;
  totalUSDCPaid: number;
};

export type AgentsResponse = {
  agents: Agent[];
};

export type AgentStatsResponse = {
  total: number;
  active: number;
  totalBalance: number;
  totalJobsCompleted: number;
};

export type JobsResponse = {
  jobs: Job[];
  counts: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    rejected: number;
  };
};

export type JobDetailResponse = {
  job: Job;
  bids: Bid[];
  completion: Completion | null;
  messages: Message[];
};

export type ActivityResponse = {
  activities: ActivityItem[];
};

// Fetch helper

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// API functions

export async function getStats(): Promise<StatsResponse> {
  return fetchAPI<StatsResponse>("/dashboard/stats");
}

export async function getAgents(): Promise<Agent[]> {
  const data = await fetchAPI<AgentsResponse>("/dashboard/agents");
  return data.agents;
}

export async function getAgentStats(): Promise<AgentStatsResponse> {
  return fetchAPI<AgentStatsResponse>("/dashboard/agents/stats");
}

export type JobsQueryParams = {
  search?: string;
  status?: JobStatus;
  min_reward?: string;
  max_reward?: string;
  sort?: "newest" | "oldest" | "highest_reward" | "lowest_reward";
};

export async function getJobs(params: JobsQueryParams = {}): Promise<JobsResponse> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.min_reward) searchParams.set("min_reward", params.min_reward);
  if (params.max_reward) searchParams.set("max_reward", params.max_reward);
  if (params.sort) searchParams.set("sort", params.sort);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/dashboard/jobs?${queryString}` : "/dashboard/jobs";

  return fetchAPI<JobsResponse>(endpoint);
}

export async function getJobDetail(id: string): Promise<JobDetailResponse> {
  return fetchAPI<JobDetailResponse>(`/dashboard/jobs/${id}`);
}

export async function getActivity(): Promise<ActivityItem[]> {
  const data = await fetchAPI<ActivityResponse>("/dashboard/activity");
  return data.activities;
}
