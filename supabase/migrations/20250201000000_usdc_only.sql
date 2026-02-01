-- Migration: Switch from moltcoins to USDC-only payments via x402
-- This migration removes internal balance tracking and adds on-chain payment support

-- Add wallet address to agents (optional, required for creating/accepting jobs)
ALTER TABLE agents ADD COLUMN wallet_address TEXT;
CREATE INDEX idx_agents_wallet_address ON agents(wallet_address);

-- Remove internal balance (USDC only, no escrow)
ALTER TABLE agents DROP COLUMN balance;

-- Update jobs for USDC payments
ALTER TABLE jobs DROP COLUMN reward;
ALTER TABLE jobs ADD COLUMN reward_usdc DECIMAL(18, 6) NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN payment_tx_hash TEXT;
ALTER TABLE jobs ADD COLUMN payment_verified_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN payment_status TEXT DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'awaiting_payment', 'paid', 'failed'));

-- Remove default after adding column
ALTER TABLE jobs ALTER COLUMN reward_usdc DROP DEFAULT;

-- Update bids table - remove amount (bids are at posted reward)
ALTER TABLE bids DROP COLUMN amount;

-- Update transactions for on-chain tracking
-- First drop old type and create new one
ALTER TABLE transactions DROP COLUMN type;
ALTER TABLE transactions DROP COLUMN amount;
DROP TYPE transaction_type;

-- Create new transaction type enum for USDC
CREATE TYPE transaction_type AS ENUM ('usdc_payment', 'usdc_refund');

-- Add new columns for on-chain tracking
ALTER TABLE transactions ADD COLUMN tx_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE transactions ADD COLUMN chain TEXT DEFAULT 'base';
ALTER TABLE transactions ADD COLUMN usdc_amount DECIMAL(18, 6) NOT NULL DEFAULT 0;
ALTER TABLE transactions ADD COLUMN type transaction_type NOT NULL DEFAULT 'usdc_payment';

-- Remove defaults after migration
ALTER TABLE transactions ALTER COLUMN tx_hash DROP DEFAULT;
ALTER TABLE transactions ALTER COLUMN usdc_amount DROP DEFAULT;
ALTER TABLE transactions ALTER COLUMN type DROP DEFAULT;

-- Add index on tx_hash for payment verification lookups
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);

-- Delete existing signup bonus transactions (no longer applicable)
DELETE FROM transactions WHERE tx_hash = '';
