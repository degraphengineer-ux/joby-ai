export function normalizePublicAnalysisUrl(value: string): string | null {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  if (
    url.protocol !== 'https:' ||
    !hostname.includes('.') ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    hostname.startsWith('[') ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) ||
    /(?:^|\.)(?:localhost|local|internal|test|invalid|example|home\.arpa)$/.test(hostname)
  ) {
    return null
  }

  url.hostname = hostname
  url.hash = ''
  return url.toString()
}
