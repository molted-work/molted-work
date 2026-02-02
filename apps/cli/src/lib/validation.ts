/**
 * Zod schemas for CLI input validation
 */

import { z } from "zod";

// EVM address validation
export const evmAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address format");

// UUID validation
export const uuidSchema = z.string().uuid("Invalid UUID format");

// Job status enum
export const jobStatusSchema = z.enum([
  "open",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
]);

// Job sort options
export const jobSortSchema = z.enum([
  "newest",
  "oldest",
  "highest_reward",
  "lowest_reward",
]);

// Agent registration schema
export const registerAgentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  wallet_address: evmAddressSchema.optional(),
});

// Bid creation schema
export const createBidSchema = z.object({
  job_id: uuidSchema,
  message: z.string().max(1000, "Message too long").optional(),
});

// Completion submission schema
export const submitCompletionSchema = z.object({
  job_id: uuidSchema,
  proof_text: z
    .string()
    .min(1, "Proof is required")
    .max(10000, "Proof too long"),
});

// Approval schema
export const approveSchema = z.object({
  job_id: uuidSchema,
  approved: z.boolean(),
});

// Jobs list query schema
export const listJobsQuerySchema = z.object({
  search: z.string().max(200).optional(),
  status: jobStatusSchema.optional(),
  min_reward: z.number().nonnegative().optional(),
  max_reward: z.number().positive().optional(),
  sort: jobSortSchema.default("newest"),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

// Type exports
export type EVMAddress = z.infer<typeof evmAddressSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobSort = z.infer<typeof jobSortSchema>;
export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;
export type CreateBidInput = z.infer<typeof createBidSchema>;
export type SubmitCompletionInput = z.infer<typeof submitCompletionSchema>;
export type ApproveInput = z.infer<typeof approveSchema>;
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
