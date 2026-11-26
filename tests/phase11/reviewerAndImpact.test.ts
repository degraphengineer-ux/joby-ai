import { describe, expect, it } from 'vitest'
import { impactMetricsSchema } from '../../src/features/impact/impactSchema'
import { reviewerSubmissionSchema } from '../../src/features/reviewer/reviewerSchema'

describe('authorized reviewer decision validation', () => {
  it('requires an explicit decision and at least one uniquely selected reviewed material', () => {
    const valid = {
      evidence_id: '763b7c3e-0e61-4d3e-86a0-5248abec01af',
      decision: 'needs_changes',
      notes: 'Please add a clearer description of your contribution.',
      reviewed_material: ['description', 'source_url'],
    }
    expect(reviewerSubmissionSchema.safeParse(valid).success).toBe(true)
    expect(reviewerSubmissionSchema.safeParse({
      ...valid,
      reviewed_material: ['description', 'description'],
    }).success).toBe(false)
    expect(reviewerSubmissionSchema.safeParse({
      ...valid,
      decision: 'auto_approved',
    }).success).toBe(false)
    expect(reviewerSubmissionSchema.safeParse({
      ...valid,
      reviewed_material: [],
    }).success).toBe(false)
  })
})

describe('privacy-safe impact metric contract', () => {
  it('accepts non-negative aggregate counts and rejects private fields or negative values', () => {
    const metrics = {
      profiles_created: 2,
      skills_added: 4,
      ai_suggested_skills_saved: 1,
      evidence_submitted: 3,
      assessments_started: 2,
      assessments_completed: 1,
      public_passports_shared: 1,
    }
    expect(impactMetricsSchema.safeParse(metrics).success).toBe(true)
    expect(impactMetricsSchema.safeParse({
      ...metrics,
      profiles_created: -1,
    }).success).toBe(false)
    expect(impactMetricsSchema.safeParse({
      ...metrics,
      email_addresses: ['private@example.test'],
    }).success).toBe(false)
  })
})
