import { z } from "zod";

const optionalEmail = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.union([z.null(), z.string().email().max(320)]).optional()
);

const emptyToNull = (v: unknown) => (v === "" ? null : v);

export const createClientSchema = z.object({
  first_name: z.string().trim().min(1).max(200),
  last_name: z.string().trim().min(1).max(200),
  date_of_birth: z.preprocess(emptyToNull, z.union([z.null(), z.string()]).optional()),
  phone: z.string().max(80).nullable().optional(),
  email: optionalEmail,
  address: z.string().max(2000).nullable().optional(),
  demographics: z.record(z.string(), z.any()).optional(),
});

export const createServiceSchema = z.object({
  client_id: z.string().uuid(),
  service_date: z.string().min(1),
  service_type_name: z.string().nullable().optional(),
  service_type: z.string().nullable().optional(),
  duration_minutes: z.number().int().min(0).max(24 * 60).nullable().optional(),
  notes: z.string().max(50000).nullable().optional(),
  staff_id: z.string().uuid().optional(),
  ai_summary: z.string().max(50000).nullable().optional(),
  ai_action_items: z.array(z.string()).optional(),
  ai_mood_risk: z.string().max(2000).nullable().optional(),
  source: z.enum(["manual", "voice"]).optional(),
  audio_transcript: z.string().max(100000).nullable().optional(),
  custom_fields: z.record(z.string(), z.any()).optional(),
});

export const serviceTypeNameSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

export const serviceTypePatchSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
});

export const aiReportPeriodSchema = z.object({
  period_start: z.string().min(1),
  period_end: z.string().min(1),
});

export const aiStructureNotesSchema = z.object({
  transcript: z.string().min(1).max(200000),
  serviceTypes: z.array(z.string().max(200)).optional(),
});

export const aiClientSummarySchema = z.object({
  client_id: z.string().uuid(),
});
