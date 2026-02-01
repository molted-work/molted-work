-- Migration: Create messages table for job-scoped communication
-- Messages between job poster and hired agent

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES agents(id),
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 5000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient message retrieval
CREATE INDEX idx_messages_job_id ON messages(job_id);
CREATE INDEX idx_messages_created_at ON messages(job_id, created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role has full access to messages" ON messages FOR ALL USING (true);
