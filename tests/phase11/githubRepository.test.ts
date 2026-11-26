import { describe, expect, it, vi } from 'vitest'
import { parseGitHubRepositoryUrl } from '../../src/features/evidence/githubRepository'
import { fetchGitHubRepositoryEvidence } from '../../supabase/functions/_shared/githubRepository'

describe('public GitHub repository analysis', () => {
  it('accepts only HTTPS repository roots and canonicalizes .git URLs', () => {
    expect(parseGitHubRepositoryUrl('https://github.com/owner/sample.git')).toEqual({
      owner: 'owner',
      repository: 'sample',
      canonicalUrl: 'https://github.com/owner/sample',
    })
    expect(parseGitHubRepositoryUrl('https://github.com/owner/sample/tree/main')).toBeNull()
    expect(parseGitHubRepositoryUrl('https://github.com.evil.test/owner/sample')).toBeNull()
    expect(parseGitHubRepositoryUrl('https://user:pass@github.com/owner/sample')).toBeNull()
    expect(parseGitHubRepositoryUrl('http://github.com/owner/sample')).toBeNull()
  })

  it('retrieves only public repository metadata and its root README', async () => {
    const requestedUrls: string[] = []
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      requestedUrls.push(url)
      if (url.endsWith('/readme')) {
        return new Response('# Project evidence\nBuilt an accessible application with responsive layouts.')
      }
      return Response.json({
        full_name: 'owner/sample',
        html_url: 'https://github.com/owner/sample',
        private: false,
        description: null,
        language: 'TypeScript',
      })
    }) as typeof fetch

    const result = await fetchGitHubRepositoryEvidence(
      'https://github.com/owner/sample',
      fetchMock,
    )

    expect(result.availability).toBe('available')
    if (result.availability === 'available') {
      expect(result.sourceText).toContain('accessible application')
      expect(result.limitations.join(' ')).toContain('authorship')
    }
    expect(requestedUrls).toEqual([
      'https://api.github.com/repos/owner/sample',
      'https://api.github.com/repos/owner/sample/readme',
    ])
    expect(requestedUrls.every((url) => new URL(url).hostname === 'api.github.com')).toBe(true)
  })

  it('reports inaccessible repositories without making a README request', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 404 })) as typeof fetch

    const result = await fetchGitHubRepositoryEvidence(
      'https://github.com/owner/private-project',
      fetchMock,
    )

    expect(result.availability).toBe('unavailable')
    expect(result.limitations.join(' ')).toContain('not public')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports a public repository without a root README as insufficient evidence', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/readme')) return new Response(null, { status: 404 })
      return Response.json({
        full_name: 'owner/no-readme',
        html_url: 'https://github.com/owner/no-readme',
        private: false,
        description: null,
        language: null,
      })
    }) as typeof fetch

    const result = await fetchGitHubRepositoryEvidence(
      'https://github.com/owner/no-readme',
      fetchMock,
    )

    expect(result.availability).toBe('insufficient')
    expect(result.sourceText).toBe('')
    expect(result.limitations.join(' ')).toContain('no root README')
  })
})
