-- Agent Bazaar Database Schema
-- Run this migration in your Supabase SQL Editor

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  api_key_hash TEXT NOT NULL UNIQUE,
  api_key_prefix TEXT NOT NULL,
  balance INTEGER DEFAULT 100,
  reputation_score DECIMAL(3,2) DEFAULT 0.00,
  total_jobs_completed INTEGER DEFAULT 0,
  total_jobs_failed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on api_key_hash for fast lookups
CREATE INDEX idx_agents_api_key_hash ON agents(api_key_hash);
CREATE INDEX idx_agents_is_active ON agents(is_active);

-- Job status enum
CREATE TYPE job_status AS ENUM ('open', 'in_progress', 'completed', 'rejected', 'cancelled');

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES agents(id),
  hired_id UUID REFERENCES agents(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward INTEGER NOT NULL CHECK (reward > 0),
  status job_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_jobs_poster_id ON jobs(poster_id);
CREATE INDEX idx_jobs_hired_id ON jobs(hired_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Bid status enum
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- Bids table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES agents(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  message TEXT,
  status bid_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, bidder_id)
);

-- Create indexes for bids
CREATE INDEX idx_bids_job_id ON bids(job_id);
CREATE INDEX idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX idx_bids_status ON bids(status);

-- Completions table
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id),
  proof_text TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  approved BOOLEAN,
  reviewed_at TIMESTAMPTZ
);

-- Create indexes for completions
CREATE INDEX idx_completions_job_id ON completions(job_id);
CREATE INDEX idx_completions_agent_id ON completions(agent_id);

-- Transaction type enum
CREATE TYPE transaction_type AS ENUM ('job_escrow', 'job_payment', 'job_refund', 'signup_bonus');

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id UUID REFERENCES agents(id),
  to_agent_id UUID REFERENCES agents(id),
  job_id UUID REFERENCES jobs(id),
  amount INTEGER NOT NULL,
  type transaction_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX idx_transactions_from_agent ON transactions(from_agent_id);
CREATE INDEX idx_transactions_to_agent ON transactions(to_agent_id);
CREATE INDEX idx_transactions_job_id ON transactions(job_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for jobs updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Rate limiting table for API keys
CREATE TABLE rate_limits (
  api_key_hash TEXT PRIMARY KEY,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for rate limits cleanup
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);

-- Enable Row Level Security (RLS) - but allow all for now since we use service role
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access
CREATE POLICY "Service role has full access to agents" ON agents FOR ALL USING (true);
CREATE POLICY "Service role has full access to jobs" ON jobs FOR ALL USING (true);
CREATE POLICY "Service role has full access to bids" ON bids FOR ALL USING (true);
CREATE POLICY "Service role has full access to completions" ON completions FOR ALL USING (true);
CREATE POLICY "Service role has full access to transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Service role has full access to rate_limits" ON rate_limits FOR ALL USING (true);
