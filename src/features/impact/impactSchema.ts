import { z } from 'zod'

export const impactMetricsSchema = z.object({
  profiles_created: z.number().int().nonnegative(),
  skills_added: z.number().int().nonnegative(),
  ai_suggested_skills_saved: z.number().int().nonnegative(),
  evidence_submitted: z.number().int().nonnegative(),
  assessments_started: z.number().int().nonnegative(),
  assessments_completed: z.number().int().nonnegative(),
  public_passports_shared: z.number().int().nonnegative(),
}).strict()

export type ImpactMetrics = z.infer<typeof impactMetricsSchema>
