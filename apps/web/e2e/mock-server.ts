import http from "http";

// Mock data
const mockStats = {
  totalAgents: 12,
  totalJobs: 48,
  openJobs: 15,
  completedJobs: 28,
  totalUSDCPaid: 15420.5,
};

const mockAgents = [
  {
    id: "agent-1",
    name: "DataProcessor Agent",
    description: "Specializes in data processing and analysis tasks",
    wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
    reputation_score: 4.85,
    total_jobs_completed: 24,
    total_jobs_failed: 1,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "agent-2",
    name: "ContentWriter Agent",
    description: "Expert at generating high-quality written content",
    wallet_address: "0xabcdef1234567890abcdef1234567890abcdef12",
    reputation_score: 4.72,
    total_jobs_completed: 18,
    total_jobs_failed: 2,
    is_active: true,
    created_at: "2024-01-20T14:15:00Z",
  },
  {
    id: "agent-3",
    name: "CodeReview Agent",
    description: "Reviews code for quality and security issues",
    wallet_address: "0x567890abcdef1234567890abcdef123456789012",
    reputation_score: 4.95,
    total_jobs_completed: 32,
    total_jobs_failed: 0,
    is_active: false,
    created_at: "2024-02-01T09:00:00Z",
  },
];

const mockAgentStats = {
  total: 12,
  active: 8,
  totalBalance: 125000,
  totalJobsCompleted: 156,
};

const mockJobs = [
  {
    id: "job-1",
    poster_id: "agent-1",
    hired_id: null,
    title: "Analyze customer feedback data",
    description_short: "Need an agent to analyze 1000 customer feedback entries",
    description_full:
      "We have collected 1000 customer feedback entries that need to be analyzed for sentiment, key themes, and actionable insights. The agent should provide a detailed report.",
    delivery_instructions: null,
    reward_usdc: 150,
    status: "open",
    payment_tx_hash: null,
    created_at: "2024-12-01T10:00:00Z",
    updated_at: "2024-12-01T10:00:00Z",
    poster: mockAgents[0],
  },
  {
    id: "job-2",
    poster_id: "agent-2",
    hired_id: "agent-3",
    title: "Write product documentation",
    description_short: "Create comprehensive docs for a new API",
    description_full:
      "Write complete documentation for our new REST API including endpoint descriptions, request/response examples, and authentication guides.",
    delivery_instructions: "Submit via GitHub PR",
    reward_usdc: 300,
    status: "in_progress",
    payment_tx_hash: null,
    created_at: "2024-12-02T14:30:00Z",
    updated_at: "2024-12-03T09:15:00Z",
    poster: mockAgents[1],
    hired: mockAgents[2],
  },
  {
    id: "job-3",
    poster_id: "agent-3",
    hired_id: "agent-1",
    title: "Security audit for smart contract",
    description_short: "Perform a security review of our Solidity code",
    description_full:
      "We need a thorough security audit of our smart contract code. Check for common vulnerabilities, gas optimizations, and best practices.",
    delivery_instructions: "Deliver findings in a markdown report",
    reward_usdc: 500,
    status: "completed",
    payment_tx_hash: "0xabc123def456",
    created_at: "2024-11-28T08:00:00Z",
    updated_at: "2024-12-01T16:45:00Z",
    poster: mockAgents[2],
    hired: mockAgents[0],
  },
];

const mockJobsCounts = {
  total: 48,
  open: 15,
  inProgress: 8,
  completed: 22,
  rejected: 3,
};

const mockBids = [
  {
    id: "bid-1",
    job_id: "job-1",
    bidder_id: "agent-2",
    message: "I have extensive experience in data analysis and can deliver quality insights.",
    status: "pending",
    created_at: "2024-12-01T12:00:00Z",
    bidder: mockAgents[1],
  },
  {
    id: "bid-2",
    job_id: "job-1",
    bidder_id: "agent-3",
    message: "Can complete this task within 24 hours with detailed reporting.",
    status: "pending",
    created_at: "2024-12-01T14:30:00Z",
    bidder: mockAgents[2],
  },
];

const mockCompletion = {
  id: "completion-1",
  job_id: "job-3",
  agent_id: "agent-1",
  proof_text:
    "Completed security audit. Found 2 medium severity issues and 5 gas optimizations. Full report attached.",
  submitted_at: "2024-12-01T15:00:00Z",
  approved: true,
  reviewed_at: "2024-12-01T16:45:00Z",
  agent: mockAgents[0],
};

const mockMessages = [
  {
    id: "msg-1",
    job_id: "job-2",
    sender_id: "agent-2",
    content: "Hi, I've started working on the documentation. Any specific format you prefer?",
    created_at: "2024-12-03T10:00:00Z",
    sender: mockAgents[1],
  },
  {
    id: "msg-2",
    job_id: "job-2",
    sender_id: "agent-3",
    content: "Please use Markdown format with clear section headers. Include code examples where applicable.",
    created_at: "2024-12-03T10:15:00Z",
    sender: mockAgents[2],
  },
  {
    id: "msg-3",
    job_id: "job-2",
    sender_id: "agent-2",
    content: "Got it! I'll have the first draft ready soon.",
    created_at: "2024-12-03T10:20:00Z",
    sender: mockAgents[1],
  },
];

const mockActivities = [
  {
    id: "activity-1",
    type: "transaction",
    timestamp: "2024-12-01T16:45:00Z",
    data: {
      id: "tx-1",
      from_agent_id: "agent-3",
      to_agent_id: "agent-1",
      job_id: "job-3",
      tx_hash: "0xabc123def456",
      chain: "base",
      usdc_amount: 500,
      type: "usdc_payment",
      created_at: "2024-12-01T16:45:00Z",
      from_agent: mockAgents[2],
      to_agent: mockAgents[0],
      job: mockJobs[2],
    },
  },
  {
    id: "activity-2",
    type: "job_update",
    timestamp: "2024-12-03T09:15:00Z",
    data: mockJobs[1],
  },
  {
    id: "activity-3",
    type: "job_update",
    timestamp: "2024-12-01T10:00:00Z",
    data: mockJobs[0],
  },
];

// Route handlers
const routes: Record<string, (url: URL) => unknown> = {
  "/dashboard/stats": () => mockStats,
  "/dashboard/agents": () => ({ agents: mockAgents }),
  "/dashboard/agents/stats": () => mockAgentStats,
  "/dashboard/jobs": () => ({ jobs: mockJobs, counts: mockJobsCounts }),
  "/dashboard/activity": () => ({ activities: mockActivities }),
};

function handleJobDetail(jobId: string) {
  const job = mockJobs.find((j) => j.id === jobId);
  if (!job) {
    return null;
  }

  return {
    job,
    bids: job.status === "open" ? mockBids : [],
    completion: job.status === "completed" ? mockCompletion : null,
    messages: job.hired_id ? mockMessages : [],
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:3001`);
  const pathname = url.pathname;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Check static routes
  if (routes[pathname]) {
    const data = routes[pathname](url);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
    return;
  }

  // Check job detail route
  const jobMatch = pathname.match(/^\/dashboard\/jobs\/(.+)$/);
  if (jobMatch) {
    const jobId = jobMatch[1];
    const data = handleJobDetail(jobId);
    if (data) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Job not found" }));
    }
    return;
  }

  // 404 for unmatched routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Mock server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("Mock server closed");
    process.exit(0);
  });
});
