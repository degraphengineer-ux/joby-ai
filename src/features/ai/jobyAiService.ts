import { supabase } from '../../lib/supabase'
import { normalizePublicAnalysisUrl } from './publicUrl'

export type AiChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function askJobyAi(
  messages: AiChatMessage[],
  urlToAnalyze?: string,
  includeProfileContext = false,
): Promise<string> {
  if (!supabase) {
    throw new Error('Joby AI requires a configured Supabase project.')
  }

  const recentMessages = messages.slice(-12)
  if (recentMessages[0]?.role === 'assistant') recentMessages.shift()
  const normalizedUrl = urlToAnalyze ? normalizePublicAnalysisUrl(urlToAnalyze) : null
  if (urlToAnalyze && !normalizedUrl) {
    throw new Error('Enter a public HTTPS page URL without credentials or a custom port.')
  }

  const { data, error } = await supabase.functions.invoke('joby-ai', {
    body: {
      messages: recentMessages,
      include_profile_context: includeProfileContext,
      ...(normalizedUrl ? { url_to_analyze: normalizedUrl } : {}),
    },
  })

  if (error) {
    const context = 'context' in error ? error.context : null
    if (context instanceof Response) {
      let payload: unknown
      try {
        payload = await context.clone().json()
      } catch {
        payload = null
      }
      if (typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string') {
        throw new Error(payload.error)
      }
    }
    throw new Error(error.message || 'Joby AI could not respond. Please try again.')
  }

  if (typeof data !== 'object' || data === null || !('reply' in data) || typeof data.reply !== 'string') {
    throw new Error('Joby AI returned an invalid response. Please try again.')
  }
  return data.reply
}
