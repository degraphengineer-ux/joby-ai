import { z } from 'zod'

export const MAX_EXTRACTION_INPUT_CHARS = 12_000

export const skillSuggestionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.string().trim().max(60),
  evidence_snippet: z.string().trim().min(1).max(500),
  reasoning: z.string().trim().min(1).max(600),
  confidence: z.number().min(0).max(1),
}).strict()

export const extractionResponseSchema = z.object({
  skills: z.array(skillSuggestionSchema).max(12),
  experience_summary: z.array(z.string().trim().min(1).max(300)).max(8),
  limitations: z.array(z.string().trim().min(1).max(300)).max(8),
}).strict()

export type SkillSuggestion = z.infer<typeof skillSuggestionSchema>
export type ExtractionResponse = z.infer<typeof extractionResponseSchema>

export const extractionRequestSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('text'),
    text: z.string().trim().min(20, 'Provide at least 20 characters of work-related text.')
      .max(MAX_EXTRACTION_INPUT_CHARS, `Text must be ${MAX_EXTRACTION_INPUT_CHARS.toLocaleString()} characters or fewer.`),
  }).strict(),
  z.object({
    source: z.literal('evidence'),
    evidence_id: z.string().uuid(),
  }).strict(),
])

export type ExtractionRequest = z.infer<typeof extractionRequestSchema>
