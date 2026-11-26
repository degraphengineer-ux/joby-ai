const requestTimeoutMs = 8_000
const maxReadmeBytes = 64 * 1024
const maxSourceChars = 12_000

type ParsedRepositoryUrl = {
  owner: string
  repository: string
  canonicalUrl: string
}

type RepositoryMetadata = {
  full_name: string
  html_url: string
  private: boolean
  description: string | null
  language: string | null
}

export function parsePublicGitHubRepositoryUrl(value: string): ParsedRepositoryUrl | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (
    url.protocol !== 'https:' ||
    url.hostname.toLowerCase() !== 'github.com' ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname.includes('%')
  ) {
    return null
  }

  const [owner, repository, ...extra] = url.pathname.split('/').filter(Boolean)
  const repoName = repository?.replace(/\.git$/i, '')
  if (
    extra.length ||
    !owner ||
    !repoName ||
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) ||
    !/^[A-Za-z0-9_.-]{1,100}$/.test(repoName)
  ) {
    return null
  }
  return {
    owner,
    repository: repoName,
    canonicalUrl: `https://github.com/${owner}/${repoName}`,
  }
}

export type GitHubEvidenceResult =
  | {
      availability: 'available'
      sourceText: string
      preview: string
      limitations: string[]
      canonicalUrl: string
    }
  | {
      availability: 'insufficient' | 'unavailable'
      sourceText: ''
      preview: string | null
      limitations: string[]
      canonicalUrl: string
      errorCode?: 'api_limited' | 'network_error' | 'invalid_response'
    }

function isRepositoryMetadata(value: unknown): value is RepositoryMetadata {
  if (typeof value !== 'object' || value === null) return false
  return (
    'full_name' in value &&
    typeof value.full_name === 'string' &&
    'html_url' in value &&
    typeof value.html_url === 'string' &&
    'private' in value &&
    typeof value.private === 'boolean' &&
    'description' in value &&
    (typeof value.description === 'string' || value.description === null) &&
    'language' in value &&
    (typeof value.language === 'string' || value.language === null)
  )
}

async function readBoundedText(response: Response): Promise<{ text: string; truncated: boolean }> {
  if (!response.body) return { text: '', truncated: false }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  let truncated = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const remaining = maxReadmeBytes - total
    if (value.byteLength > remaining) {
      chunks.push(value.slice(0, Math.max(remaining, 0)))
      total += Math.max(remaining, 0)
      truncated = true
      await reader.cancel()
      break
    }
    chunks.push(value)
    total += value.byteLength
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { text: new TextDecoder().decode(bytes), truncated }
}

export async function fetchGitHubRepositoryEvidence(
  repositoryUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GitHubEvidenceResult> {
  const repository = parsePublicGitHubRepositoryUrl(repositoryUrl)
  if (!repository) {
    return {
      availability: 'unavailable',
      sourceText: '',
      preview: null,
      canonicalUrl: repositoryUrl,
      limitations: ['Provide an HTTPS URL for a public github.com/owner/repository. No other hosts or paths are fetched.'],
      errorCode: 'invalid_response',
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}`
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Joby-AI',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  try {
    const repositoryResponse = await fetchImpl(apiUrl, {
      headers,
      redirect: 'error',
      signal: controller.signal,
    })
    if (repositoryResponse.status === 404) {
      return {
        availability: 'unavailable',
        sourceText: '',
        preview: null,
        canonicalUrl: repository.canonicalUrl,
        limitations: ['The repository is unavailable or not public. No repository content was analyzed.'],
      }
    }
    if (repositoryResponse.status === 403 || repositoryResponse.status === 429) {
      return {
        availability: 'unavailable',
        sourceText: '',
        preview: null,
        canonicalUrl: repository.canonicalUrl,
        limitations: ['GitHub temporarily limited this request. No repository content was analyzed; try again later.'],
        errorCode: 'api_limited',
      }
    }
    if (!repositoryResponse.ok) {
      return {
        availability: 'unavailable',
        sourceText: '',
        preview: null,
        canonicalUrl: repository.canonicalUrl,
        limitations: ['GitHub repository information could not be retrieved. No repository content was analyzed.'],
        errorCode: 'network_error',
      }
    }

    let metadataValue: unknown
    try {
      metadataValue = await repositoryResponse.json()
    } catch {
      metadataValue = null
    }
    if (!isRepositoryMetadata(metadataValue) || metadataValue.private) {
      return {
        availability: 'unavailable',
        sourceText: '',
        preview: null,
        canonicalUrl: repository.canonicalUrl,
        limitations: ['GitHub did not return valid public repository metadata. No repository content was analyzed.'],
        errorCode: 'invalid_response',
      }
    }
    const returnedRepository = parsePublicGitHubRepositoryUrl(metadataValue.html_url)
    if (
      metadataValue.full_name.toLowerCase() !==
        `${repository.owner}/${repository.repository}`.toLowerCase() ||
      !returnedRepository ||
      returnedRepository.canonicalUrl.toLowerCase() !==
        repository.canonicalUrl.toLowerCase()
    ) {
      return {
        availability: 'unavailable',
        sourceText: '',
        preview: null,
        canonicalUrl: repository.canonicalUrl,
        limitations: ['GitHub returned a different repository than the submitted URL. No content was analyzed.'],
        errorCode: 'invalid_response',
      }
    }

    const readmeUrl = `${apiUrl}/readme`
    const readmeResponse = await fetchImpl(readmeUrl, {
      headers: { ...headers, Accept: 'application/vnd.github.raw+json' },
      redirect: 'error',
      signal: controller.signal,
    })
    if (readmeResponse.status === 404) {
      return {
        availability: 'insufficient',
        sourceText: '',
        preview: null,
        canonicalUrl: repository.canonicalUrl,
        limitations: ['The public repository is accessible, but it has no root README. There is not enough retrieved evidence for skill suggestions. Repository code was not fetched or executed.'],
      }
    }
    if (readmeResponse.status === 403 || readmeResponse.status === 429) {
      return {
        availability: 'unavailable',
        sourceText: '',
        preview: null,
        canonicalUrl: repository.canonicalUrl,
        limitations: ['GitHub temporarily limited the README request. No repository content was analyzed; try again later.'],
        errorCode: 'api_limited',
      }
    }
    if (!readmeResponse.ok) {
      return {
        availability: 'unavailable',
        sourceText: '',
        preview: null,
        canonicalUrl: repository.canonicalUrl,
        limitations: ['The public README could not be retrieved. No repository content was analyzed.'],
        errorCode: 'network_error',
      }
    }

    const readme = await readBoundedText(readmeResponse)
    const sourceText = readme.text.trim().slice(0, maxSourceChars)
    if (sourceText.length < 20) {
      return {
        availability: 'insufficient',
        sourceText: '',
        preview: sourceText || null,
        canonicalUrl: repository.canonicalUrl,
        limitations: ['The public root README contains too little text for grounded skill suggestions. Repository code was not fetched or executed.'],
      }
    }
    const limitations = [
      'Only the public repository metadata and root README were retrieved; repository files and code were not fetched or executed.',
      'A public URL or README does not verify the submitting user’s authorship or the quality of the project.',
    ]
    if (readme.truncated || sourceText.length >= maxSourceChars) {
      limitations.push('The README was truncated to the analysis size limit.')
    }

    return {
      availability: 'available',
      sourceText,
      preview: readme.text.slice(0, maxSourceChars),
      limitations,
      canonicalUrl: repository.canonicalUrl,
    }
  } catch {
    return {
      availability: 'unavailable',
      sourceText: '',
      preview: null,
      canonicalUrl: repository.canonicalUrl,
      limitations: ['GitHub could not be reached in time. No repository content was analyzed; try again later.'],
      errorCode: 'network_error',
    }
  } finally {
    clearTimeout(timeout)
  }
}
