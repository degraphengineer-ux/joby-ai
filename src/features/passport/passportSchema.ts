import { z } from 'zod'

const publicWebUrlSchema = z.string().url().refine((value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
})

export const publicPassportEvidenceSchema = z.object({
  title: z.string().min(1).max(120),
  evidence_type: z.enum(['project_url', 'github_url', 'document', 'text_sample']),
  description: z.string().max(2000).nullable(),
  source_url: publicWebUrlSchema.nullable(),
  submitted_at: z.string(),
  human_reviewed: z.boolean(),
  external_credential_verified: z.boolean(),
}).strict()

export const publicPassportSkillSchema = z.object({
  name: z.string().min(1).max(80),
  category: z.string().nullable(),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'unsure']),
  status_labels: z.array(z.enum([
    'Self-reported',
    'Evidence submitted',
    'Human reviewed',
    'External credential',
  ])),
  evidence: z.array(publicPassportEvidenceSchema),
}).strict()

export const publicPassportCriterionSchema = z.object({
  criterion: z.string().min(1).max(120),
  score: z.number().int().min(0).max(4),
  max_score: z.number().int().min(1).max(4),
}).strict()

export const publicPassportAssessmentSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  completed_at: z.string(),
  method_label: z.enum(['AI-assisted assessment', 'Human reviewed']),
  score: z.number().int().nonnegative(),
  max_score: z.number().int().positive(),
  criteria: z.array(publicPassportCriterionSchema).min(1).max(12),
}).strict().superRefine((assessment, context) => {
  const expectedTotal = assessment.criteria.reduce((total, criterion) => total + criterion.score, 0)
  const maximumTotal = assessment.criteria.reduce((total, criterion) => total + criterion.max_score, 0)

  if (assessment.score !== expectedTotal || assessment.max_score !== maximumTotal) {
    context.addIssue({
      code: 'custom',
      message: 'Assessment totals do not match the rubric criteria.',
    })
  }

  if (assessment.criteria.some((criterion) => criterion.score > criterion.max_score)) {
    context.addIssue({
      code: 'custom',
      message: 'A rubric score exceeds its maximum.',
    })
  }
})

export const publicPassportSchema = z.object({
  display_name: z.string().min(1).max(80),
  headline: z.string().nullable(),
  bio: z.string().nullable(),
  last_updated_at: z.string(),
  skills: z.array(publicPassportSkillSchema),
  other_evidence: z.array(publicPassportEvidenceSchema),
  assessments: z.array(publicPassportAssessmentSchema),
}).strict()

export const passportCorrectionRequestSchema = z.object({
  message: z.string().trim().min(10, 'Describe the issue in at least 10 characters.').max(2000),
  contact_email: z.union([
    z.literal(''),
    z.string().trim().email('Enter a valid contact email address.').max(254),
  ]),
})

export type PublicPassport = z.infer<typeof publicPassportSchema>
export type PublicPassportEvidence = z.infer<typeof publicPassportEvidenceSchema>
export type PublicPassportSkill = z.infer<typeof publicPassportSkillSchema>
