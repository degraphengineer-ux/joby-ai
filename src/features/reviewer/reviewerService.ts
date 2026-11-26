import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import {
  reviewedMaterialSchema,
  reviewerSubmissionSchema,
} from './reviewerSchema'

const reviewerEvidenceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  evidence_type: z.string().min(1),
  description: z.string().nullable(),
  source_url: z.string().url().nullable(),
  private_file_url: z.string().url().nullable(),
  private_file_error: z.string().nullable(),
  reviewable_materials: z.array(reviewedMaterialSchema),
  submitted_at: z.string(),
}).strict()

const reviewerQueueSchema = z.object({
  evidence: z.array(reviewerEvidenceSchema),
}).strict()

const reviewSchema = z.object({
  id: z.string().uuid(),
  evidence_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  decision: z.enum(['accepted', 'needs_changes', 'rejected']),
  notes: z.string().nullable(),
  reviewed_material: z.array(reviewedMaterialSchema),
  reviewed_at: z.string(),
}).strict()

export type ReviewedMaterial = z.infer<typeof reviewedMaterialSchema>
export type ReviewDecision = z.infer<typeof reviewSchema>['decision']
export type ReviewerEvidence = z.infer<typeof reviewerEvidenceSchema>
export type ReviewerSubmission = z.infer<typeof reviewerSubmissionSchema>

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key.')
  }
  return supabase
}

async function invokeReviewerFunction(body: Record<string, unknown>) {
  const { data, error } = await getClient().functions.invoke('review-evidence', { body })
  if (error) {
    const context = 'context' in error ? error.context : null
    if (context instanceof Response) {
      try {
        const responseBody: unknown = await context.clone().json()
        if (
          typeof responseBody === 'object' &&
          responseBody !== null &&
          'error' in responseBody &&
          typeof responseBody.error === 'string'
        ) {
          throw new Error(responseBody.error)
        }
      } catch (cause) {
        if (cause instanceof Error && cause.message !== error.message) throw cause
      }
    }
    throw new Error(error.message || 'The reviewer service could not be reached.')
  }
  return data
}

export async function listReviewerEvidence(): Promise<ReviewerEvidence[]> {
  const response = reviewerQueueSchema.safeParse(
    await invokeReviewerFunction({ action: 'list' }),
  )
  if (!response.success) {
    throw new Error('The reviewer service returned an invalid evidence queue.')
  }
  return response.data.evidence
}

export async function submitEvidenceReview(input: ReviewerSubmission) {
  const parsedInput = reviewerSubmissionSchema.safeParse(input)
  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? 'Review the decision and materials, then try again.')
  }
  const response = z.object({ review: reviewSchema }).strict().safeParse(
    await invokeReviewerFunction({ action: 'record', ...parsedInput.data }),
  )
  if (!response.success) {
    throw new Error('The reviewer service returned an invalid review record.')
  }
  return response.data.review
}
