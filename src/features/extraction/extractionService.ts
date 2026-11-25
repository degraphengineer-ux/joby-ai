import { supabase } from '../../lib/supabase'
import {
  extractionRequestSchema,
  extractionResponseSchema,
  type ExtractionRequest,
  type ExtractionResponse,
} from './extractionSchema'

export class ExtractionError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message)
    this.name = 'ExtractionError'
  }
}

function getClient() {
  if (!supabase) {
    throw new ExtractionError('Supabase is not configured. Add the project URL and publishable key.')
  }
  return supabase
}

export async function extractSkills(input: ExtractionRequest): Promise<ExtractionResponse> {
  const parsedInput = extractionRequestSchema.safeParse(input)
  if (!parsedInput.success) {
    throw new ExtractionError(
      parsedInput.error.issues[0]?.message ?? 'Provide valid text or select an evidence item.',
      400,
    )
  }

  const { data, error } = await getClient().functions.invoke('extract-skills', {
    body: parsedInput.data,
  })

  if (error) {
    const context = 'context' in error ? error.context : null
    if (context instanceof Response) {
      let retryAfterSeconds = Number(context.headers.get('Retry-After')) || undefined
      let responseMessage: string | undefined
      let responseBody: unknown
      try {
        responseBody = await context.clone().json()
      } catch {
        responseBody = null
      }
      if (typeof responseBody === 'object' && responseBody !== null) {
        if ('error' in responseBody && typeof responseBody.error === 'string') {
          responseMessage = responseBody.error
        }
        if (
          !retryAfterSeconds &&
          'retry_after_seconds' in responseBody &&
          typeof responseBody.retry_after_seconds === 'number'
        ) {
          retryAfterSeconds = responseBody.retry_after_seconds
        }
      }

      const retryMessage = context.status === 429 && retryAfterSeconds
        ? ` Try again in about ${Math.max(1, Math.ceil(retryAfterSeconds / 60))} minute(s).`
        : ''
      throw new ExtractionError(
        `${responseMessage ?? (
          context.status === 429
            ? 'You have reached the extraction request limit. Please wait before trying again.'
            : 'The extraction request failed. Your input is preserved; please retry.'
        )}${retryMessage}`,
        context.status,
        retryAfterSeconds,
      )
    }

    if (error.message.toLowerCase().includes('fetch')) {
      throw new ExtractionError('Could not reach the extraction service. Your input is preserved; check your connection and retry.')
    }
    throw new ExtractionError(error.message || 'Extraction failed. Your input is preserved; please retry.')
  }

  const response = extractionResponseSchema.safeParse(data)
  if (!response.success) {
    throw new ExtractionError('The extraction service returned an invalid response. No suggestions were saved; please retry.', 502)
  }

  return response.data
}
