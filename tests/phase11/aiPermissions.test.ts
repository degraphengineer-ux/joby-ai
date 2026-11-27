import { describe, expect, it } from 'vitest'
import { readAiPermissions } from '../../src/features/ai/aiPermissions'
import { normalizePublicAnalysisUrl } from '../../src/features/ai/publicUrl'

describe('Joby AI privacy permissions', () => {
  it('defaults every AI permission to off unless explicitly enabled', () => {
    expect(readAiPermissions(null)).toEqual({
      profileContext: false,
      quizSkillContext: false,
      assessmentSkillContext: false,
      publicUrlAnalysis: false,
    })
    expect(readAiPermissions({
      joby_ai_permissions: {
        profile_context: true,
        quiz_skill_context: 'yes',
        assessment_skill_context: true,
      },
    })).toEqual({
      profileContext: true,
      quizSkillContext: false,
      assessmentSkillContext: true,
      publicUrlAnalysis: false,
    })
  })

  it('allows only public HTTPS URLs without credentials, IP hosts, or custom ports', () => {
    expect(normalizePublicAnalysisUrl('https://example.com/project#preview')).toBe('https://example.com/project')
    for (const url of [
      'http://example.com',
      'https://localhost',
      'https://service.local',
      'https://127.0.0.1',
      'https://[::1]/',
      'https://user:password@example.com',
      'https://example.com:8443',
      'not a URL',
    ]) {
      expect(normalizePublicAnalysisUrl(url)).toBeNull()
    }
  })
})
