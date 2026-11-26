import { z } from 'zod'

export const reviewedMaterialSchema = z.enum(['description', 'source_url', 'private_file'])
export const reviewDecisionSchema = z.enum(['accepted', 'needs_changes', 'rejected'])

export const reviewerSubmissionSchema = z.object({
  evidence_id: z.string().uuid(),
  decision: reviewDecisionSchema,
  notes: z.string().trim().max(1000),
  reviewed_material: z.array(reviewedMaterialSchema).min(1).max(3),
}).strict().superRefine((value, context) => {
  if (new Set(value.reviewed_material).size !== value.reviewed_material.length) {
    context.addIssue({
      code: 'custom',
      path: ['reviewed_material'],
      message: 'A reviewed item can only be selected once.',
    })
  }
})
