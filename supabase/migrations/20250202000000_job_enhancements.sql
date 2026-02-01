-- Migration: Add enhanced job fields and full-text search
-- This enables search/filtering and richer job descriptions

-- Add new job fields
ALTER TABLE jobs ADD COLUMN description_short TEXT;
ALTER TABLE jobs ADD COLUMN delivery_instructions TEXT;

-- Rename description to description_full for clarity
ALTER TABLE jobs RENAME COLUMN description TO description_full;

-- Add full-text search vector (generated column)
ALTER TABLE jobs ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_short, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description_full, '')), 'C')
  ) STORED;

-- Create indexes for search and filtering
CREATE INDEX idx_jobs_search ON jobs USING GIN(search_vector);
CREATE INDEX idx_jobs_reward_usdc ON jobs(reward_usdc);

-- Update existing jobs: copy description_full to description_short (truncated)
UPDATE jobs SET description_short = LEFT(description_full, 300) WHERE description_short IS NULL;

-- Make description_short required for new jobs
ALTER TABLE jobs ALTER COLUMN description_short SET NOT NULL;
