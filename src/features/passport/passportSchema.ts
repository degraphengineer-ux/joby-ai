import { z } from 'zod'

export const credentialTypes = [
  'degree',
  'diploma',
  'license',
  'certificate',
  'micro_credential',
  'workshop',
  'other',
] as const

export const credentialInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  credential_type: z.enum(credentialTypes),
  issuer_name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000),
  issued_at: z.string().date().or(z.literal('')),
  expires_at: z.string().date().or(z.literal('')),
  credential_identifier: z.string().trim().max(160),
}).superRefine((credential, context) => {
  if (credential.issued_at && credential.expires_at && credential.expires_at <= credential.issued_at) {
    context.addIssue({ code: 'custom', path: ['expires_at'], message: 'Expiry date must be after the issue date.' })
  }
})

export const experienceInputSchema = z.object({
  experience_type: z.enum(['employment', 'project', 'volunteer']),
  title: z.string().trim().min(1).max(160),
  organization: z.string().trim().max(160),
  description: z.string().trim().max(3000),
  location: z.string().trim().max(120),
  started_at: z.string().date().or(z.literal('')),
  ended_at: z.string().date().or(z.literal('')),
  is_current: z.boolean(),
  visibility: z.enum(['private', 'public']),
}).superRefine((experience, context) => {
  if (experience.started_at && experience.ended_at && experience.ended_at < experience.started_at) {
    context.addIssue({ code: 'custom', path: ['ended_at'], message: 'End date cannot be before start date.' })
  }
  if (experience.is_current && experience.ended_at) {
    context.addIssue({ code: 'custom', path: ['ended_at'], message: 'Current experience cannot have an end date.' })
  }
})

export const credentialIssuerRequestSchema = z.object({
  display_name: z.string().trim().min(1).max(120),
  issuer_url: z.string().url().max(2048).refine((value) => {
    try {
      const url = new URL(value)
      return url.protocol === 'https:' && !url.username && !url.password
    } catch {
      return false
    }
  }, 'Use a public HTTPS issuer URL without credentials.'),
  issuer_type: z.enum(['education', 'employer', 'certification_body', 'other']),
})

export type CredentialInput = z.infer<typeof credentialInputSchema>
export type ExperienceInput = z.infer<typeof experienceInputSchema>
export type CredentialIssuerRequest = z.infer<typeof credentialIssuerRequestSchema>

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
  proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert', 'unsure']),
  status_labels: z.array(z.enum([
    'Self-reported',
    'Verified',
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
  credentials: z.array(z.object({
    title: z.string().min(1).max(160),
    credential_type: z.enum(credentialTypes),
    issuer_name: z.string().min(1).max(160),
    issued_at: z.string().nullable(),
    expires_at: z.string().nullable(),
    status: z.enum(['self_reported', 'pending_verification', 'verified', 'expired', 'revoked']),
    credential_identifier: z.string().nullable(),
  }).strict()).default([]),
  experience: z.array(z.object({
    experience_type: z.enum(['employment', 'project', 'volunteer']),
    title: z.string().min(1).max(160),
    organization: z.string().nullable(),
    description: z.string().nullable(),
    started_at: z.string().nullable(),
    ended_at: z.string().nullable(),
    is_current: z.boolean(),
  }).strict()).default([]),
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
