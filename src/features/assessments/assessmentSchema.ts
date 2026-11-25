import { z } from 'zod'

export const MAX_ASSESSMENT_SUBMISSION_CHARS = 20_000

export const assessmentDifficultySchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
])

export const rubricDimensionSchema = z.object({
  criterion: z.string().trim().min(1).max(120),
  max_score: z.number().int().min(1).max(4),
  description: z.string().trim().min(1).max(1000),
}).strict()

export const assessmentRubricSchema = z.object({
  dimensions: z.array(rubricDimensionSchema).min(1).max(12),
  score_range: z.object({
    minimum: z.number().int(),
    maximum: z.number().int(),
  }).optional(),
  total_max_score: z.number().int().positive().optional(),
  method_label: z.string().trim().min(1).optional(),
  limitations: z.string().trim().min(1).optional(),
}).passthrough()

export const assessmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  instructions: z.string().trim().min(1),
  expected_deliverable: z.string().trim().min(1),
  rubric: assessmentRubricSchema,
  difficulty: assessmentDifficultySchema,
  is_active: z.boolean(),
})

export const assessmentAttemptSchema = z.object({
  id: z.string().uuid(),
  assessment_id: z.string().uuid(),
  user_id: z.string().uuid(),
  submission_text: z.string().nullable(),
  submission_url: z.string().nullable(),
  status: z.enum(['started', 'submitted', 'processing', 'completed', 'failed']),
  total_score: z.number().nullable(),
  feedback: z.unknown().nullable(),
  assessment_method: z.enum(['ai_assisted', 'human_review']),
  submitted_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  processing_started_at: z.string().nullable(),
  created_at: z.string(),
})

const assessmentSubmissionBaseSchema = z.object({
  submission_text: z.string()
    .trim()
    .min(20, 'Add at least 20 characters describing or showing your work.')
    .max(MAX_ASSESSMENT_SUBMISSION_CHARS, `Submission must be ${MAX_ASSESSMENT_SUBMISSION_CHARS.toLocaleString()} characters or fewer.`),
  submission_url: z.string()
    .trim()
    .max(2048, 'Project URL must be 2,048 characters or fewer.'),
})

export const assessmentSubmissionSchema = assessmentSubmissionBaseSchema.superRefine((value, context) => {
  if (!value.submission_url) return

  let url: URL
  try {
    url = new URL(value.submission_url)
  } catch {
    context.addIssue({
      code: 'custom',
      path: ['submission_url'],
      message: 'Enter a valid project URL beginning with https://.',
    })
    return
  }

  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username.length > 0 ||
    url.password.length > 0
  ) {
    context.addIssue({
      code: 'custom',
      path: ['submission_url'],
      message: 'Use an http or https URL without embedded credentials.',
    })
  }
})

export const assessmentFeedbackCriterionSchema = z.object({
  criterion: z.string().trim().min(1).max(120),
  score: z.number().int().min(0).max(4),
  max_score: z.number().int().min(1).max(4),
  feedback: z.string().trim().min(1).max(1000),
}).strict()

export const assessmentFeedbackSchema = z.object({
  assessment_title: z.string().trim().min(1).max(200),
  assessment_category: z.string().trim().min(1).max(100),
  total_max_score: z.number().int().positive(),
  method_label: z.enum(['AI-assisted assessment', 'Human reviewed']),
  criteria: z.array(assessmentFeedbackCriterionSchema).min(1).max(12),
  strengths: z.array(z.string().trim().min(1).max(500)).max(8),
  improvements: z.array(z.string().trim().min(1).max(500)).max(8),
  overall_summary: z.string().trim().min(1).max(2000),
  evidence_limitations: z.array(z.string().trim().min(1).max(500)).max(8),
}).strict()

export type Assessment = z.infer<typeof assessmentSchema>
export type AssessmentAttempt = z.infer<typeof assessmentAttemptSchema>
export type AssessmentRubric = z.infer<typeof assessmentRubricSchema>
export type AssessmentSubmission = z.infer<typeof assessmentSubmissionSchema>
export type AssessmentFeedback = z.infer<typeof assessmentFeedbackSchema>
