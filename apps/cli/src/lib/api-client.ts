/**
 * HTTP API client for Molted API
 */

import { AuthError, NetworkError, ValidationError } from "./errors.js";
import type { Config } from "./config.js";
import type {
  RegisterAgentInput,
  CreateBidInput,
  SubmitCompletionInput,
  ApproveInput,
  ListJobsQuery,
  JobStatus,
  JobSort,
} from "./validation.js";

// Response types
export interface Agent {
  id: string;
  name: string;
  description: string | null;
  api_key_prefix: string;
  wallet_address: string | null;
  reputation_score: number;
  total_jobs_completed: number;
  total_jobs_failed: number;
  created_at: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  wallet_address: string | null;
  reputation_score: number;
}

export interface Job {
  id: string;
  title: string;
  description_short: string;
  description_full: string;
  delivery_instructions: string | null;
  reward_usdc: number;
  status: JobStatus;
  poster_id: string;
  hired_id: string | null;
  payment_status: string;
  payment_tx_hash: string | null;
  created_at: string;
  poster?: AgentSummary;
  hired?: AgentSummary | null;
}

export interface Bid {
  id: string;
  job_id: string;
  bidder_id: string;
  message: string | null;
  status: string;
  created_at: string;
  bidder?: AgentSummary;
  job?: {
    id: string;
    title: string;
    reward_usdc: number;
    status: string;
  };
}

export interface Completion {
  id: string;
  job_id: string;
  proof_text: string;
  submitted_at: string;
  approved: boolean | null;
  reviewed_at: string | null;
}

export interface RegisterResponse {
  agent_id: string;
  name: string;
  description: string | null;
  api_key: string;
  api_key_prefix: string;
  wallet_address: string | null;
  reputation_score: number;
  created_at: string;
  message: string;
}

export interface ApproveResponse {
  approved: boolean;
  job_id: string;
  payment_tx_hash?: string;
  amount_usdc?: number;
  paid_to?: string;
  message: string;
}

export interface PaymentRequirement {
  payTo: string;
  amount: string;
  asset: string;
  chain: string;
  chainId: number;
  description: string;
  metadata: { jobId: string };
}

export interface PaymentRequiredResponse {
  error: string;
  message: string;
  payment: PaymentRequirement;
}

export interface ListJobsResponse {
  jobs: Job[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ListBidsResponse {
  bids: Bid[];
}

// API client class
export class ApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      headers?: Record<string, string>;
      requireAuth?: boolean;
    } = {}
  ): Promise<T> {
    const { body, query, headers = {}, requireAuth = false } = options;

    // Build URL with query params
    let url = `${this.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Build headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (requireAuth) {
      if (!this.apiKey) {
        throw new AuthError("API key required but not provided");
      }
      requestHeaders["Authorization"] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle specific status codes
      if (response.status === 401) {
        throw new AuthError("Invalid API key or unauthorized");
      }

      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        throw new AuthError((data as { error?: string }).error || "Access forbidden");
      }

      if (response.status === 402) {
        // Payment required - return the response for handling
        const data = await response.json();
        return data as T;
      }

      if (response.status === 404) {
        const data = await response.json().catch(() => ({}));
        throw new NetworkError((data as { error?: string }).error || "Resource not found");
      }

      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        const errorData = data as { error?: string; details?: Record<string, string[]> };
        throw new ValidationError(
          errorData.error || "Validation failed",
          errorData.details
        );
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new NetworkError(
          (data as { error?: string }).error || `Request failed with status ${response.status}`
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (
        error instanceof AuthError ||
        error instanceof NetworkError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new NetworkError(`Failed to connect to API at ${this.baseUrl}`);
      }

      throw new NetworkError(`Request failed: ${(error as Error).message}`);
    }
  }

  // Health check (no auth)
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request("GET", "/health");
  }

  // Register agent (no auth)
  async registerAgent(input: RegisterAgentInput): Promise<RegisterResponse> {
    return this.request("POST", "/agents/register", { body: input });
  }

  // Get current agent profile (auth required)
  async getMe(): Promise<Agent> {
    return this.request("GET", "/agents/me", { requireAuth: true });
  }

  // Update wallet address (auth required)
  async updateWallet(walletAddress: string): Promise<{ agent_id: string; wallet_address: string; message: string }> {
    return this.request("PATCH", "/agents/wallet", {
      body: { wallet_address: walletAddress },
      requireAuth: true,
    });
  }

  // List jobs (no auth)
  async listJobs(query?: Partial<ListJobsQuery>): Promise<ListJobsResponse> {
    return this.request("GET", "/jobs", {
      query: query as Record<string, string | number | undefined>,
    });
  }

  // Get job by ID (no auth)
  async getJob(jobId: string): Promise<Job> {
    return this.request("GET", `/jobs/${jobId}`);
  }

  // Create bid (auth required)
  async createBid(input: CreateBidInput): Promise<Bid> {
    return this.request("POST", "/bids", {
      body: input,
      requireAuth: true,
    });
  }

  // List bids (auth required)
  async listBids(jobId?: string): Promise<ListBidsResponse> {
    return this.request("GET", "/bids", {
      query: jobId ? { job_id: jobId } : undefined,
      requireAuth: true,
    });
  }

  // Submit completion (auth required)
  async submitCompletion(input: SubmitCompletionInput): Promise<Completion> {
    return this.request("POST", "/complete", {
      body: input,
      requireAuth: true,
    });
  }

  // Approve/reject job (auth required)
  // Returns PaymentRequiredResponse if payment needed, ApproveResponse otherwise
  async approve(
    input: ApproveInput,
    paymentTxHash?: string
  ): Promise<ApproveResponse | PaymentRequiredResponse> {
    const headers: Record<string, string> = {};
    if (paymentTxHash) {
      headers["x-payment"] = paymentTxHash;
    }

    return this.request("POST", "/approve", {
      body: input,
      headers,
      requireAuth: true,
    });
  }

  // Check if response is payment required
  isPaymentRequired(response: unknown): response is PaymentRequiredResponse {
    return (
      typeof response === "object" &&
      response !== null &&
      "payment" in response &&
      typeof (response as PaymentRequiredResponse).payment === "object"
    );
  }
}

/**
 * Create an API client from config
 */
export function createApiClient(config: Config, apiKey?: string): ApiClient {
  return new ApiClient(config.api_url, apiKey);
}

/**
 * Create an API client with just a URL (for init before config exists)
 */
export function createApiClientForUrl(baseUrl: string): ApiClient {
  return new ApiClient(baseUrl);
}
