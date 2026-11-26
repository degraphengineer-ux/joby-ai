import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it } from 'vitest'
import { extractPdfText } from '../../supabase/functions/_shared/pdfTextExtractor'
import type { PrivatePassport } from '../../src/features/passport/passportService'
import { buildPassportPdf } from '../../src/features/passport/passportPdf'

const passport: PrivatePassport = {
  profile: {
    id: 'a912e017-e4f7-479c-9a8b-bcdefef6f390',
    display_name: 'Sample Candidate',
    headline: 'Frontend developer',
    bio: 'Builds accessible and responsive web experiences.',
    location: 'Private location',
    target_role: 'Frontend developer',
    years_experience: 2,
    avatar_path: null,
    is_public: false,
    public_slug: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  skills: [{
    id: '1194e8f4-4a2d-4987-81dc-f2b1385ef862',
    user_id: 'a912e017-e4f7-479c-9a8b-bcdefef6f390',
    name: 'Responsive design',
    category: 'Frontend',
    self_reported_level: 'intermediate',
    description: 'Builds layouts that adapt to different screen sizes.',
    source: 'user',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }],
  evidence: [{
    id: '22f3d54b-f8c7-4697-bfb5-6d51d1ba3c01',
    user_id: 'a912e017-e4f7-479c-9a8b-bcdefef6f390',
    title: 'Private work sample',
    evidence_type: 'document',
    description: 'A private file description.',
    source_url: null,
    storage_path: 'private-storage-path-that-must-not-be-exported',
    mime_type: 'application/pdf',
    processing_status: 'pending',
    visibility: 'private',
    reviewer_consent: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    linkedSkills: [],
    reviews: [],
    externalCredentials: [],
  }],
  assessments: [],
  invalidAssessmentCount: 0,
  lastUpdatedAt: '2026-01-01T00:00:00Z',
}

describe('Skills Passport PDF export', () => {
  it('generates a local PDF summary without including storage paths or account identifiers', async () => {
    const bytes = await buildPassportPdf(passport)
    const parsed = await extractPdfText(bytes, pdfjs)

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.text).toContain('Sample Candidate')
      expect(parsed.text).toContain('Responsive design')
      expect(parsed.text).toContain('Private work sample')
      expect(parsed.text).not.toContain('private-storage-path')
      expect(parsed.text).not.toContain(passport.profile.id)
    }
  })
})

describe('additional assessment category compatibility', () => {
  it('preserves the fixed rubric contract for each new category', async () => {
    const { assessmentSchema } = await import('../../src/features/assessments/assessmentSchema')
    const rubric = {
      dimensions: [{
        criterion: 'Evidence and reasoning',
        max_score: 4,
        description: 'Uses the submitted evidence carefully.',
      }],
      score_range: { minimum: 0, maximum: 4 },
      total_max_score: 4,
      method_label: 'AI-assisted assessment',
      limitations: 'Advisory only.',
    }

    for (const category of ['data_analysis', 'customer_support']) {
      expect(assessmentSchema.safeParse({
        id: '35bbf638-badb-41d0-ac2e-6bc391600e55',
        title: `Sample ${category}`,
        category,
        description: 'A trusted task.',
        instructions: 'Complete the task.',
        expected_deliverable: 'A written response.',
        rubric,
        difficulty: 'beginner',
        is_active: true,
      }).success).toBe(true)
    }
  })
})
