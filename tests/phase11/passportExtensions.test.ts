import { describe, expect, it } from 'vitest'
import { matchCareerRequirements } from '../../src/features/passport/careerMatching'
import { credentialInputSchema, experienceInputSchema } from '../../src/features/passport/passportSchema'
import { skillSchema } from '../../src/features/skills/skillSchema'

describe('Skills Passport extensions', () => {
  it('keeps entered credentials explicitly self-reported and validates lifecycle dates', () => {
    const enteredCredential = credentialInputSchema.safeParse({
      title: 'Cloud fundamentals',
      credential_type: 'certificate',
      issuer_name: 'Example Academy',
      description: '',
      issued_at: '2026-03-01',
      expires_at: '2025-03-01',
      credential_identifier: '',
    })
    expect(enteredCredential.success).toBe(false)

    expect(credentialInputSchema.safeParse({
      title: 'Cloud fundamentals',
      credential_type: 'certificate',
      issuer_name: 'Example Academy',
      description: '',
      issued_at: '2025-03-01',
      expires_at: '2026-03-01',
      credential_identifier: '',
    }).success).toBe(true)
  })

  it('validates structured experience date ranges', () => {
    expect(experienceInputSchema.safeParse({
      experience_type: 'employment',
      title: 'Developer',
      organization: '',
      description: '',
      location: '',
      started_at: '2024-01-01',
      ended_at: '2023-12-31',
      is_current: false,
      visibility: 'private',
    }).success).toBe(false)
  })

  it('accepts skill types and expert proficiency while requiring complete taxonomy identifiers', () => {
    const expertSkill = skillSchema.safeParse({
      name: 'French',
      category: 'Languages',
      self_reported_level: 'expert',
      description: '',
      skill_type: 'language',
      taxonomy_framework: 'joby-sample',
      taxonomy_code: 'LANG-FR',
    })
    expect(expertSkill.success).toBe(true)

    expect(skillSchema.safeParse({
      name: 'French',
      category: 'Languages',
      self_reported_level: 'expert',
      description: '',
      skill_type: 'language',
      taxonomy_framework: 'joby-sample',
      taxonomy_code: '',
    }).success).toBe(false)
  })

  it('separates registered skills from verified skills in role matching', () => {
    const match = matchCareerRequirements(
      ['HTML', 'JavaScript', 'CSS'],
      [
        { name: 'html', verified_level: 'intermediate' },
        { name: 'CSS', verified_level: null },
      ],
    )
    expect(match).toEqual({
      matchedSkills: ['HTML', 'CSS'],
      verifiedMatchedSkills: ['HTML'],
      missingSkills: ['JavaScript'],
      matchPercent: 67,
    })
  })

  it('matches equivalent skill names and shared taxonomy codes', () => {
    const match = matchCareerRequirements(
      [
        { name: 'Customer service', taxonomy_framework: 'joby-sample', taxonomy_code: 'SOFT-CUSTOMER-SERVICE' },
        { name: 'Communication' },
      ],
      [
        { name: 'CUSTOMER-service', verified_level: null, taxonomy_framework: 'joby-sample', taxonomy_code: 'SOFT-CUSTOMER-SERVICE' },
        { name: 'Communication', verified_level: 'advanced' },
        { name: 'communication', verified_level: null },
      ],
    )

    expect(match).toEqual({
      matchedSkills: ['Customer service', 'Communication'],
      verifiedMatchedSkills: ['Communication'],
      missingSkills: [],
      matchPercent: 100,
    })
  })
})
