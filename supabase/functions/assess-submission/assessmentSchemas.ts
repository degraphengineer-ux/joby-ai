import { z } from 'https://esm.sh/zod@4.6.7'
import { scoreRubricCriteria } from './assessmentScoring.ts'

const rubricDimensionSchema = z.object({
  criterion: z.string().trim().min(1).max(120),
  max_score: z.literal(4),
  description: z.string().trim().min(1).max(1000),
}).strict()

const trustedRubricSchema = z.object({
  dimensions: z.array(rubricDimensionSchema).min(1).max(12),
  score_range: z.object({
    minimum: z.literal(0),
    maximum: z.literal(4),
  }),
  total_max_score: z.number().int().positive(),
  method_label: z.string().trim().min(1),
  limitations: z.string().trim().min(1),
}).passthrough()

const modelFeedbackSchema = z.object({
  criteria: z.array(z.object({
    criterion: z.string().trim().min(1).max(120),
    score: z.number().int().min(0).max(4),
    feedback: z.string().trim().min(1).max(1000),
  }).strict()).min(1).max(12),
  strengths: z.array(z.string().trim().min(1).max(500)).max(8),
  improvements: z.array(z.string().trim().min(1).max(500)).max(8),
  overall_summary: z.string().trim().min(1).max(2000),
  evidence_limitations: z.array(z.string().trim().min(1).max(500)).max(8),
}).strict()

export type TrustedRubric = z.infer<typeof trustedRubricSchema>
export type ScoredCriterion = {
  criterion: string
  score: number
  max_score: number
  feedback: string
}
export type ValidatedAssessmentFeedback = {
  criteria: ScoredCriterion[]
  strengths: string[]
  improvements: string[]
  overall_summary: string
  evidence_limitations: string[]
}

export function parseTrustedRubric(value: unknown): TrustedRubric {
  const parsed = trustedRubricSchema.safeParse(value)
  if (!parsed.success) throw new Error('The stored assessment rubric is invalid.')

  const criteria = parsed.data.dimensions.map((dimension) => dimension.criterion)
  if (new Set(criteria).size !== criteria.length) {
    throw new Error('The stored assessment rubric contains duplicate criteria.')
  }

  const expectedTotal = parsed.data.dimensions.reduce(
    (total, dimension) => total + dimension.max_score,
    0,
  )
  if (expectedTotal !== parsed.data.total_max_score) {
    throw new Error('The stored assessment rubric total does not match its criteria.')
  }

  return parsed.data
}

export function validateModelFeedback(
  value: unknown,
  rubric: TrustedRubric,
):
  | {
      ok: true
      feedback: ValidatedAssessmentFeedback
      totalScore: number
      totalMaxScore: number
    }
  | { ok: false; correction: string } {
  const parsed = modelFeedbackSchema.safeParse(value)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 8)
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    return {
      ok: false,
      correction: `Correct the JSON schema issues: ${issues}. Return only valid JSON.`,
    }
  }

  const scored = scoreRubricCriteria(rubric.dimensions, parsed.data.criteria)
  if (!scored.ok) {
    return { ok: false, correction: scored.reason }
  }

  return {
    ok: true,
    feedback: {
      criteria: scored.criteria,
      strengths: parsed.data.strengths,
      improvements: parsed.data.improvements,
      overall_summary: parsed.data.overall_summary,
      evidence_limitations: parsed.data.evidence_limitations,
    },
    totalScore: scored.totalScore,
    totalMaxScore: scored.totalMaxScore,
  }
}
