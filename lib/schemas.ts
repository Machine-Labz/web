import { z } from "zod";

// Primitives
export const hex32 = z
  .string()
  .regex(/^[0-9a-fA-F]{64}$/, "hex32 (64 hex chars)");

export const publicInputs104Hex = z
  .string()
  .regex(/^[0-9a-fA-F]{208}$/, "public_bin_hex must be 208 hex chars");

export const proofHex260 = z
  .string()
  .regex(/^[0-9a-fA-F]{520}$/, "proof_hex_260 must be 520 hex chars");

export const base64 = z
  .string()
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, "Invalid base64");

export const uint64String = z
  .string()
  .regex(/^[0-9]{1,20}$/, "uint64 string");

// Schemas
export const OutputSchema = z.object({
  address_hex32: hex32,
  amount_u64: uint64String.transform((s) => BigInt(s)),
});
export type Output = z.infer<typeof OutputSchema>;

export const FeeCapsSchema = z.object({
  max_priority_fee_lamports: uint64String
    .transform((s) => BigInt(s))
    .optional(),
  max_total_fee_lamports: uint64String
    .transform((s) => BigInt(s))
    .optional(),
});
export type FeeCaps = z.infer<typeof FeeCapsSchema>;

export const PayerHintsSchema = z.object({
  use_jito: z.boolean().optional(),
  bundle_tip_lamports: uint64String
    .transform((s) => BigInt(s))
    .optional(),
  cu_limit: z.number().int().min(0).max(0xffffffff).optional(),
});
export type PayerHints = z.infer<typeof PayerHintsSchema>;

export const WithdrawJobRequestSchema = z.object({
  public_bin_hex: publicInputs104Hex,
  outputs: z.array(OutputSchema).min(1),
  deadline_iso: z.string().datetime(),
  payer_hints: PayerHintsSchema.optional(),
  fee_caps: FeeCapsSchema.optional(),
});
export type WithdrawJobRequest = z.infer<typeof WithdrawJobRequestSchema>;

export const JobStatusSchema = z.enum(["queued", "running", "done", "failed"]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const JobResponseSchema = z.object({
  job_id: z.string().uuid(),
  status: JobStatusSchema,
});
export type JobResponse = z.infer<typeof JobResponseSchema>;

export const JobArtifactsSchema = z.object({
  proof_hex_260: proofHex260.optional(),
  public_bin_hex_104: publicInputs104Hex.optional(),
  tx_bytes_base64: base64.optional(),
});
export type JobArtifacts = z.infer<typeof JobArtifactsSchema>;

export const JobStatusResponseSchema = z.object({
  job_id: z.string().uuid(),
  status: JobStatusSchema,
  artifacts: JobArtifactsSchema.optional(),
  error: z.string().optional(),
});
export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;

export const SubmitRequestSchema = z.object({
  tx_bytes_base64: base64,
});
export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;

export const SubmitResponseSchema = z.object({
  signature: z.string(),
  slot: z.number().int().min(0).optional(),
});
export type SubmitResponse = z.infer<typeof SubmitResponseSchema>;

export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});
export type ApiError = z.infer<typeof ErrorSchema>;

