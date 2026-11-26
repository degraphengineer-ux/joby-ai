export type GitHubRepository = {
  owner: string
  repository: string
  canonicalUrl: string
}

const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/
const repositoryPattern = /^[A-Za-z0-9_.-]{1,100}$/

export function parseGitHubRepositoryUrl(value: string): GitHubRepository | null {
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

  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length !== 2) return null

  const owner = segments[0]
  const repository = segments[1].replace(/\.git$/i, '')
  if (!ownerPattern.test(owner) || !repositoryPattern.test(repository)) return null

  return {
    owner,
    repository,
    canonicalUrl: `https://github.com/${owner}/${repository}`,
  }
}
