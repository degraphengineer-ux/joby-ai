import { z } from 'zod'
import { parseGitHubRepositoryUrl } from './githubRepository'

export const evidenceTypes = [
  'project_url',
  'github_url',
  'text_sample',
  'document',
] as const

export type EvidenceType = (typeof evidenceTypes)[number]

export const evidenceTypeLabels: Record<EvidenceType, string> = {
  project_url: 'Project URL',
  github_url: 'GitHub repository',
  text_sample: 'Text sample or project description',
  document: 'PDF or project screenshot',
}

export const evidenceSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(120, 'Title must be 120 characters or fewer.'),
  evidence_type: z.enum(evidenceTypes),
  description: z.string().trim().max(2000, 'Description must be 2,000 characters or fewer.'),
  source_url: z.string().trim().max(2048, 'URL is too long.'),
  skill_ids: z.array(z.string().uuid()).refine(
    (ids) => new Set(ids).size === ids.length,
    'A skill can only be linked once.',
  ),
  relationship_note: z.string().trim().max(400, 'Relationship note must be 400 characters or fewer.'),
  reviewer_consent: z.boolean(),
}).superRefine((value, context) => {
  if (value.evidence_type === 'text_sample' && !value.description) {
    context.addIssue({
      code: 'custom',
      path: ['description'],
      message: 'Add a text sample or project description.',
    })
  }

  if (value.evidence_type !== 'project_url' && value.evidence_type !== 'github_url') {
    return
  }

  let url: URL
  try {
    url = new URL(value.source_url)
  } catch {
    context.addIssue({
      code: 'custom',
      path: ['source_url'],
      message: 'Enter a valid web URL beginning with https://.',
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
      path: ['source_url'],
      message: 'Use an http or https URL without embedded credentials.',
    })
  }

  if (value.evidence_type === 'github_url') {
    if (!parseGitHubRepositoryUrl(value.source_url)) {
      context.addIssue({
        code: 'custom',
        path: ['source_url'],
        message: 'Enter the public repository URL only, such as https://github.com/owner/repository.',
      })
    }
  }
})

export type EvidenceInput = z.infer<typeof evidenceSchema>

export type EvidenceRecord = {
  id: string
  user_id: string
  title: string
  evidence_type: EvidenceType
  description: string | null
  source_url: string | null
  storage_path: string | null
  mime_type: string | null
  processing_status: 'pending' | 'processed' | 'failed'
  visibility: 'private' | 'public'
  reviewer_consent: boolean
  created_at: string
  updated_at: string
}

export type EvidenceSkillLink = {
  skill_id: string
  relationship_note: string | null
}

export const emptyEvidence = (): EvidenceInput => ({
  title: '',
  evidence_type: 'project_url',
  description: '',
  source_url: '',
  skill_ids: [],
  relationship_note: '',
  reviewer_consent: false,
})
