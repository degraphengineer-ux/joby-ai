import { AlertTriangle, ArrowLeft, CheckCircle2, LoaderCircle, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../../components/ui/Feedback'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import { useAuth } from '../auth/useAuth'
import {
  assessmentFeedbackSchema,
  type AssessmentAttempt,
  type AssessmentFeedback,
} from './assessmentSchema'
import {
  AssessmentEvaluationError,
  getOwnAttempt,
  requestAssessmentEvaluation,
} from './assessmentsService'

function feedbackFromAttempt(attempt: AssessmentAttempt | null): AssessmentFeedback | null {
  if (!attempt || attempt.status !== 'completed') return null
  const parsed = assessmentFeedbackSchema.safeParse(attempt.feedback)
  if (!parsed.success) return null

  const scoreTotal = parsed.data.criteria.reduce((total, criterion) => total + criterion.score, 0)
  const maximumTotal = parsed.data.criteria.reduce((total, criterion) => total + criterion.max_score, 0)
  const expectedMethodLabel =
    attempt.assessment_method === 'human_review'
      ? 'Human reviewed'
      : 'AI-assisted assessment'
  if (
    parsed.data.method_label !== expectedMethodLabel ||
    attempt.total_score !== scoreTotal ||
    parsed.data.total_max_score !== maximumTotal ||
    parsed.data.criteria.some((criterion) => criterion.score > criterion.max_score)
  ) {
    return null
  }
  return parsed.data
}

export function AssessmentResultsPage() {
  const { attemptId = '' } = useParams()
  const { user } = useAuth()
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)
  const autoStartedAttempt = useRef<string | null>(null)

  const refreshAttempt = useCallback(async () => {
    if (!user || !attemptId) return
    const latest = await getOwnAttempt(user.id, attemptId)
    if (!latest) {
      setAttempt(null)
      return
    }
    setAttempt(latest)
  }, [attemptId, user])

  useEffect(() => {
    let active = true
    if (!user || !attemptId) {
      setIsLoading(false)
      return
    }
    getOwnAttempt(user.id, attemptId)
      .then((ownAttempt) => {
        if (active) setAttempt(ownAttempt)
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(displayDatabaseError(cause))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [attemptId, user])

  const evaluate = useCallback(async () => {
    if (!user || !attemptId) return
    setEvaluationError(null)
    setIsEvaluating(true)
    try {
      await requestAssessmentEvaluation(attemptId)
      await refreshAttempt()
    } catch (cause) {
      setEvaluationError(
        cause instanceof AssessmentEvaluationError
          ? cause.message
          : displayDatabaseError(cause),
      )
      try {
        await refreshAttempt()
      } catch (refreshError) {
        setEvaluationError(
          `${cause instanceof Error ? cause.message : 'Assessment failed.'} ${displayDatabaseError(refreshError)}`,
        )
      }
    } finally {
      setIsEvaluating(false)
    }
  }, [attemptId, refreshAttempt, user])

  useEffect(() => {
    if (
      attempt?.status === 'submitted' &&
      autoStartedAttempt.current !== attempt.id
    ) {
      autoStartedAttempt.current = attempt.id
      void evaluate()
    }
  }, [attempt, evaluate])

  const retryRefresh = async () => {
    setLoadError(null)
    setIsLoading(true)
    try {
      await refreshAttempt()
    } catch (cause) {
      setLoadError(displayDatabaseError(cause))
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <PageContainer className="py-10"><LoadingState label="Loading your assessment result..." /></PageContainer>
  }

  if (loadError) {
    return (
      <PageContainer className="max-w-3xl py-10">
        <ErrorState>{loadError}</ErrorState>
        <Button className="mt-4" variant="secondary" onClick={retryRefresh}>Reload attempt</Button>
      </PageContainer>
    )
  }

  if (!attempt) {
    return (
      <PageContainer className="max-w-3xl py-10">
        <EmptyState title="Assessment attempt not found">
          <p>This attempt may have been deleted, or it may not belong to your account.</p>
        </EmptyState>
        <Link to="/assessments" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy hover:text-teal-700">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to assessments
        </Link>
      </PageContainer>
    )
  }

  const feedback = feedbackFromAttempt(attempt)
  const feedbackInvalid = attempt.status === 'completed' && !feedback
  const title = feedback?.assessment_title ?? 'Assessment feedback'

  return (
    <PageContainer className="max-w-4xl py-8 sm:py-12">
      <Link to="/assessments" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slatebody hover:text-teal-700">
        <ArrowLeft size={17} aria-hidden="true" />
        All assessments
      </Link>
      <PageHeading
        title={title}
        description={attempt.assessment_method === 'human_review'
          ? 'Human review reflects a reviewer decision and is not an official certification or qualification.'
          : 'AI-assisted assessment feedback is advisory and is not an official certification or qualification.'}
      />

      {evaluationError && <div className="mb-5"><ErrorState>{evaluationError}</ErrorState></div>}

      {feedbackInvalid && (
        <div className="mb-5">
          <ErrorState>The stored assessment result failed validation. No score is shown; contact support for help.</ErrorState>
        </div>
      )}

      {attempt.status === 'completed' && feedback && (
        <div className="space-y-6">
          <Card className="p-5 shadow-card sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slatebody">{feedback.method_label}</p>
                <p className="mt-2 text-3xl font-bold text-navy">
                  {attempt.total_score} <span className="text-lg font-semibold text-slatebody">/ {feedback.total_max_score}</span>
                </p>
              </div>
              <Badge tone="teal">{feedback.assessment_category.replace(/_/g, ' ')}</Badge>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-navy/10" role="progressbar"
              aria-label="Total assessment score"
              aria-valuemin={0}
              aria-valuemax={feedback.total_max_score}
              aria-valuenow={attempt.total_score ?? 0}
            >
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: `${Math.min(100, ((attempt.total_score ?? 0) / feedback.total_max_score) * 100)}%` }}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-slatebody">{feedback.overall_summary}</p>
            <p className="mt-4 flex items-start gap-2 border-t border-navy/10 pt-4 text-xs leading-5 text-slatebody">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
              This result considers only the written submission. Project URLs are not opened; authorship and unseen work are not verified.
            </p>
          </Card>

          <Card className="p-5 shadow-card sm:p-7">
            <h2 className="text-xl font-bold text-navy">Criterion feedback</h2>
            <ul className="mt-4 divide-y divide-navy/10">
              {feedback.criteria.map((criterion) => (
                <li key={criterion.criterion} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-bold text-navy">{criterion.criterion}</h3>
                    <Badge tone={criterion.score >= 3 ? 'teal' : 'slate'}>
                      {criterion.score} / {criterion.max_score}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slatebody">{criterion.feedback}</p>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card className="p-5 shadow-card sm:p-6">
              <h2 className="flex items-center gap-2 font-bold text-navy">
                <CheckCircle2 size={18} className="text-success" aria-hidden="true" />
                Strengths
              </h2>
              {feedback.strengths.length ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slatebody">
                  {feedback.strengths.map((item, index) => <li key={`strength-${index}`}>{item}</li>)}
                </ul>
              ) : <p className="mt-3 text-sm text-slatebody">No distinct strengths could be identified from the submitted text.</p>}
            </Card>
            <Card className="p-5 shadow-card sm:p-6">
              <h2 className="font-bold text-navy">Improvement areas</h2>
              {feedback.improvements.length ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slatebody">
                  {feedback.improvements.map((item, index) => <li key={`improvement-${index}`}>{item}</li>)}
                </ul>
              ) : <p className="mt-3 text-sm text-slatebody">No specific next steps were returned.</p>}
            </Card>
          </div>

          <Card className="p-5 shadow-card sm:p-6">
            <h2 className="font-bold text-navy">Evidence limitations</h2>
            {feedback.evidence_limitations.length ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slatebody">
                {feedback.evidence_limitations.map((item, index) => <li key={`limitation-${index}`}>{item}</li>)}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slatebody">
                Evaluation was limited to the written response. The project URL, if supplied, was not opened.
              </p>
            )}
          </Card>
          <SuccessState>
            Completed {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : ''} · {feedback.method_label} · Not a formal credential
          </SuccessState>
        </div>
      )}

      {attempt.status !== 'completed' && (
        <Card className="p-5 shadow-card sm:p-7">
          <h2 className="text-lg font-bold text-navy">
            {attempt.status === 'processing' ? 'Assessment in progress' : 'Assessment status'}
          </h2>
          {attempt.status === 'processing' ? (
            <p className="mt-2 text-sm leading-6 text-slatebody">
              Your submission is saved and being assessed. Do not submit it again while processing.
            </p>
          ) : attempt.status === 'failed' ? (
            <p className="mt-2 text-sm leading-6 text-slatebody">
              Your submission is still saved. Retry the assessment when the service is available.
            </p>
          ) : attempt.status === 'started' ? (
            <p className="mt-2 text-sm leading-6 text-slatebody">This attempt has not been submitted yet.</p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slatebody">
              Your submission is saved and will be evaluated now.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {attempt.status === 'failed' || attempt.status === 'submitted' ? (
              <Button onClick={evaluate} disabled={isEvaluating}>
                {isEvaluating
                  ? <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
                  : <RefreshCw size={17} aria-hidden="true" />}
                {attempt.status === 'failed' ? 'Retry assessment' : 'Try assessment now'}
              </Button>
            ) : attempt.status === 'processing' ? (
              <Button variant="secondary" onClick={retryRefresh} disabled={isLoading}>
                {isLoading
                  ? <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
                  : <RefreshCw size={17} aria-hidden="true" />}
                Refresh status
              </Button>
            ) : (
              <Link
                to={`/assessments/${attempt.assessment_id}?attempt=${attempt.id}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-navy/15 bg-white px-4 text-sm font-semibold text-navy hover:border-teal/50 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                Continue submission
              </Link>
            )}
          </div>
          <p className="mt-4 text-xs leading-5 text-slatebody">
            Your submission remains saved if Gemini is unavailable. The score is calculated by the server from the fixed rubric.
          </p>
        </Card>
      )}
    </PageContainer>
  )
}
