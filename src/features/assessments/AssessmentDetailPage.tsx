import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState, LoadingState } from '../../components/ui/Feedback'
import { Input } from '../../components/ui/Input'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import { useAuth } from '../auth/useAuth'
import { initialProfileName } from '../profile/profileService'
import {
  assessmentSubmissionSchema,
  MAX_ASSESSMENT_SUBMISSION_CHARS,
  type Assessment,
  type AssessmentAttempt,
  type AssessmentSubmission,
} from './assessmentSchema'
import {
  getActiveAssessment,
  getOwnAttempt,
  saveAssessmentSubmission,
  startAssessment,
} from './assessmentsService'

function getValidationMessages(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const messages: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string') messages[field] ??= issue.message
  }
  return messages
}

const emptySubmission = (): AssessmentSubmission => ({
  submission_text: '',
  submission_url: '',
})

export function AssessmentDetailPage() {
  const { assessmentId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const attemptId = searchParams.get('attempt')
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null)
  const [draft, setDraft] = useState<AssessmentSubmission>(emptySubmission())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !assessmentId) return
    let active = true
    Promise.all([
      getActiveAssessment(assessmentId),
      attemptId ? getOwnAttempt(user.id, attemptId) : Promise.resolve(null),
    ])
      .then(([activeAssessment, ownAttempt]) => {
        if (!active) return
        setAssessment(activeAssessment)
        setAttempt(ownAttempt)
        if (attemptId && !ownAttempt) setError('That attempt was not found in your account.')
        if (ownAttempt) {
          setDraft({
            submission_text: ownAttempt.submission_text ?? '',
            submission_url: ownAttempt.submission_url ?? '',
          })
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(displayDatabaseError(cause))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [assessmentId, attemptId, user])

  const handleStart = async () => {
    if (!user || !assessment) return
    setError(null)
    setIsStarting(true)
    try {
      const newAttempt = await startAssessment(user.id, assessment.id, initialProfileName(user))
      setAttempt(newAttempt)
      setDraft(emptySubmission())
      navigate(`/assessments/${assessment.id}?attempt=${newAttempt.id}`, { replace: true })
    } catch (cause) {
      setError(displayDatabaseError(cause))
    } finally {
      setIsStarting(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    const parsed = assessmentSubmissionSchema.safeParse(draft)
    if (!parsed.success) {
      setFieldErrors(getValidationMessages(parsed.error))
      return
    }
    if (!user || !attempt) return

    setIsSubmitting(true)
    try {
      await saveAssessmentSubmission(user.id, attempt.id, parsed.data)
      navigate(`/assessments/results/${attempt.id}`)
    } catch (cause) {
      setError(displayDatabaseError(cause))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <PageContainer className="py-10"><LoadingState label="Loading assessment..." /></PageContainer>
  }

  if (!assessment) {
    return (
      <PageContainer className="max-w-3xl py-10">
        {error && <ErrorState>{error}</ErrorState>}
        {!error && <ErrorState>This assessment is not available.</ErrorState>}
        <Link to="/assessments" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy hover:text-teal-700">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to assessments
        </Link>
      </PageContainer>
    )
  }

  const rubric = assessment.rubric

  return (
    <PageContainer className="max-w-4xl py-8 sm:py-12">
      <Link to="/assessments" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slatebody hover:text-teal-700">
        <ArrowLeft size={17} aria-hidden="true" />
        All assessments
      </Link>
      <PageHeading title={assessment.title} description={assessment.description} />

      {error && <div className="mb-5"><ErrorState>{error}</ErrorState></div>}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <Card className="p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="teal">{assessment.difficulty}</Badge>
              <span className="text-xs font-semibold uppercase tracking-wide text-slatebody">
                {assessment.category.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="mt-5 text-lg font-bold text-navy">Instructions</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slatebody">{assessment.instructions}</p>
            <h3 className="mt-5 border-t border-navy/10 pt-4 text-sm font-bold text-navy">Expected deliverable</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slatebody">{assessment.expected_deliverable}</p>
          </Card>

          <Card className="p-5 shadow-card sm:p-6">
            <h2 className="text-lg font-bold text-navy">Fixed assessment rubric</h2>
            <p className="mt-1 text-sm leading-6 text-slatebody">
              Each criterion is scored from 0 to 4. Gemini cannot change these criteria.
            </p>
            <ul className="mt-4 divide-y divide-navy/10">
              {rubric.dimensions.map((dimension) => (
                <li key={dimension.criterion} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-navy">{dimension.criterion}</h3>
                    <Badge>{dimension.max_score} points</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slatebody">{dimension.description}</p>
                </li>
              ))}
            </ul>
            {rubric.limitations && (
              <p className="mt-5 border-t border-navy/10 pt-4 text-sm leading-6 text-slatebody">
                {rubric.limitations}
              </p>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          {attempt?.status === 'started' ? (
            <Card className="p-5 shadow-card sm:p-6">
              <h2 className="text-lg font-bold text-navy">Submit your work</h2>
              <p className="mt-2 text-sm leading-6 text-slatebody">
                Include a written description or text sample. A URL may be added as context, but its contents are not fetched or assessed.
              </p>
              <form className="mt-5 space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="assessment-submission" className="block text-sm font-semibold text-navy">
                    Work description or text submission
                  </label>
                  <textarea
                    id="assessment-submission"
                    name="submission_text"
                    rows={9}
                    maxLength={MAX_ASSESSMENT_SUBMISSION_CHARS}
                    value={draft.submission_text}
                    onChange={(event) => {
                      setDraft((current) => ({ ...current, submission_text: event.target.value }))
                      setFieldErrors((current) => ({ ...current, submission_text: '' }))
                    }}
                    aria-invalid={Boolean(fieldErrors.submission_text)}
                    aria-describedby="assessment-submission-hint assessment-submission-count assessment-submission-error"
                    placeholder="Describe the profile card you built, what evidence it includes, how the layout changes across sizes, and any relevant HTML/CSS details."
                    className="mt-2 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-3 text-base text-navy outline-none placeholder:text-slatebody/60 focus:border-teal focus:ring-4 focus:ring-teal/10"
                  />
                  <div className="mt-2 flex flex-col gap-1 text-xs text-slatebody sm:flex-row sm:justify-between">
                    <p id="assessment-submission-hint">Only this written text is sent to Gemini.</p>
                    <p id="assessment-submission-count" aria-live="polite">
                      {draft.submission_text.length.toLocaleString()} / {MAX_ASSESSMENT_SUBMISSION_CHARS.toLocaleString()}
                    </p>
                  </div>
                  {fieldErrors.submission_text && (
                    <p id="assessment-submission-error" className="mt-1 text-sm text-error">{fieldErrors.submission_text}</p>
                  )}
                </div>
                <div>
                  <Input
                    label="Project URL (optional)"
                    name="submission_url"
                    type="url"
                    maxLength={2048}
                    placeholder="https://example.com/your-project"
                    value={draft.submission_url}
                    onChange={(event) => {
                      setDraft((current) => ({ ...current, submission_url: event.target.value }))
                      setFieldErrors((current) => ({ ...current, submission_url: '' }))
                    }}
                    aria-invalid={Boolean(fieldErrors.submission_url)}
                    aria-describedby="assessment-url-hint assessment-url-error"
                  />
                  <p id="assessment-url-hint" className="mt-1 text-xs leading-5 text-slatebody">
                    Saved with your attempt for reference only. The evaluator does not open or inspect this URL.
                  </p>
                  {fieldErrors.submission_url && (
                    <p id="assessment-url-error" className="mt-1 text-sm text-error">{fieldErrors.submission_url}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting && <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />}
                  Submit for AI-assisted feedback
                  {!isSubmitting && <ArrowRight size={17} aria-hidden="true" />}
                </Button>
                <p className="text-xs leading-5 text-slatebody">
                  Your submission is saved before evaluation. Feedback is advisory and is not an official qualification.
                </p>
              </form>
            </Card>
          ) : attempt ? (
            <Card className="p-5 shadow-card sm:p-6">
              <h2 className="text-lg font-bold text-navy">Attempt status: {attempt.status}</h2>
              <p className="mt-2 text-sm leading-6 text-slatebody">
                {attempt.status === 'failed'
                  ? 'Your submission is preserved. Open the results page to retry the assessment.'
                  : 'Your saved submission and feedback status are available on the results page.'}
              </p>
              <Link
                to={`/assessments/results/${attempt.id}`}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Open results and status
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </Card>
          ) : (
            <Card className="p-5 shadow-card sm:p-6">
              <h2 className="text-lg font-bold text-navy">Ready to begin?</h2>
              <p className="mt-2 text-sm leading-6 text-slatebody">
                Starting creates a private attempt. Your work is saved before AI evaluation.
              </p>
              <Button className="mt-5 w-full" size="lg" onClick={handleStart} disabled={isStarting}>
                {isStarting && <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />}
                Start assessment
              </Button>
            </Card>
          )}
          <p className="text-xs leading-5 text-slatebody">
            Results are labelled AI-assisted assessment. They are advisory and are not an official certification.
          </p>
        </aside>
      </div>
    </PageContainer>
  )
}
