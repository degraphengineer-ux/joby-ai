import { Check, ExternalLink, FileText, LoaderCircle } from '../../components/ui/icons'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../../components/ui/Feedback'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import {
  listReviewerEvidence,
  submitEvidenceReview,
  type ReviewedMaterial,
  type ReviewerEvidence,
  type ReviewDecision,
} from './reviewerService'

const materialLabels: Record<ReviewedMaterial, string> = {
  description: 'Evidence description',
  source_url: 'Public source URL',
  private_file: 'Private uploaded file',
}

export function ReviewerDashboardPage() {
  const [evidence, setEvidence] = useState<ReviewerEvidence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadQueue = useCallback(async () => {
    setLoadError(null)
    setIsLoading(true)
    try {
      setEvidence(await listReviewerEvidence())
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : 'The reviewer queue could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  const handleReviewed = (evidenceId: string) => {
    setEvidence((current) => current.filter((item) => item.id !== evidenceId))
    setSuccess('The decision and reviewed materials were recorded with your reviewer identity and timestamp.')
  }

  return (
    <PageContainer className="max-w-5xl py-8 sm:py-12">
      <PageHeading
        title="Evidence review"
        description="Review only items for which the candidate has explicitly opted in. Decisions are recorded with your authenticated reviewer identity."
        action={<Button variant="secondary" onClick={() => void loadQueue()} disabled={isLoading}>Refresh queue</Button>}
      />

      <div className="mb-6 rounded-xl border border-teal/20 bg-teal/5 p-4 text-sm leading-6 text-navy">
        Review is a human decision, separate from AI assessment. Select the specific material you inspected; no decision or verification label is created until you submit it.
      </div>
      {success && <div className="mb-5"><SuccessState>{success}</SuccessState></div>}
      {loadError && (
        <div className="mb-5 space-y-3">
          <ErrorState>{loadError}</ErrorState>
          {loadError.includes('not authorized') && (
            <p className="text-sm leading-6 text-slatebody">
              Access is granted by an administrator in Supabase. Sign-in alone does not grant reviewer permissions.
            </p>
          )}
          <Button variant="secondary" onClick={() => void loadQueue()}>Try again</Button>
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading consented evidence..." />
      ) : !loadError && evidence.length === 0 ? (
        <EmptyState title="No consented evidence is waiting for review">
          <p>Evidence appears here only while its owner has opted in. Your submitted decisions are not presented as automatic verification.</p>
        </EmptyState>
      ) : (
        <ul className="space-y-5">
          {evidence.map((item) => (
            <li key={item.id}>
              <ReviewerEvidenceCard evidence={item} onReviewed={handleReviewed} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}

function ReviewerEvidenceCard({
  evidence,
  onReviewed,
}: {
  evidence: ReviewerEvidence
  onReviewed: (evidenceId: string) => void
}) {
  const [decision, setDecision] = useState<ReviewDecision | ''>('')
  const [notes, setNotes] = useState('')
  const [reviewedMaterial, setReviewedMaterial] = useState<ReviewedMaterial[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleMaterial = (material: ReviewedMaterial) => {
    setReviewedMaterial((current) => current.includes(material)
      ? current.filter((item) => item !== material)
      : [...current, material])
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!decision || reviewedMaterial.length === 0) {
      setError('Choose a decision and identify at least one item of evidence you reviewed.')
      return
    }
    setIsSaving(true)
    try {
      await submitEvidenceReview({
        evidence_id: evidence.id,
        decision,
        notes,
        reviewed_material: reviewedMaterial,
      })
      onReviewed(evidence.id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The review decision could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card as="article" className="p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="teal">{evidence.evidence_type.replace(/_/g, ' ')}</Badge>
        <span className="text-xs text-slatebody">
          Submitted {new Date(evidence.submitted_at).toLocaleDateString()}
        </span>
      </div>
      <h2 className="mt-3 text-xl font-bold text-navy">{evidence.title}</h2>
      {evidence.description && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slatebody">{evidence.description}</p>
      )}
      {evidence.source_url && (
        <a
          href={evidence.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 break-all text-sm font-semibold text-teal-700 underline"
        >
          <ExternalLink size={16} aria-hidden="true" />
          Open public source
        </a>
      )}
      {evidence.private_file_url && (
        <a
          href={evidence.private_file_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 underline"
        >
          <FileText size={16} aria-hidden="true" />
          Open private file (link expires in 60 seconds)
        </a>
      )}
      {evidence.private_file_error && (
        <p className="mt-3 text-sm text-warning" role="status">{evidence.private_file_error}</p>
      )}

      <form className="mt-5 space-y-4 border-t border-navy/10 pt-5" onSubmit={handleSubmit}>
        <fieldset>
          <legend className="text-sm font-semibold text-navy">What did you review? (required)</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {evidence.reviewable_materials.map((material) => (
              <label key={material} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-navy/10 px-3 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={reviewedMaterial.includes(material)}
                  onChange={() => toggleMaterial(material)}
                  className="h-4 w-4 rounded border-navy/30 text-teal focus:ring-teal"
                />
                {materialLabels[material]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`review-decision-${evidence.id}`} className="block text-sm font-semibold text-navy">
              Decision
            </label>
            <select
              id={`review-decision-${evidence.id}`}
              required
              value={decision}
              onChange={(event) => setDecision(event.target.value as ReviewDecision | '')}
              className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3 text-base text-navy"
            >
              <option value="">Choose a decision</option>
              <option value="accepted">Accepted</option>
              <option value="needs_changes">Needs changes</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label htmlFor={`review-notes-${evidence.id}`} className="block text-sm font-semibold text-navy">
              Feedback (optional)
            </label>
            <textarea
              id={`review-notes-${evidence.id}`}
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-2 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy"
            />
          </div>
        </div>
        {error && <ErrorState>{error}</ErrorState>}
        <Button type="submit" disabled={isSaving || !decision || reviewedMaterial.length === 0}>
          {isSaving
            ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            : <Check size={16} aria-hidden="true" />}
          {isSaving ? 'Recording review...' : 'Record human review'}
        </Button>
      </form>
    </Card>
  )
}
