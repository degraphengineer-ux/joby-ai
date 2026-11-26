import { AlertTriangle, Check, LoaderCircle, RotateCcw, Sparkles, X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../../components/ui/Feedback'
import { Input } from '../../components/ui/Input'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import { useAuth } from '../auth/useAuth'
import { initialProfileName } from '../profile/profileService'
import { createSkill } from '../skills/skillsService'
import { proficiencyLevels, skillSchema, type SkillInput } from '../skills/skillSchema'
import { listEvidence, linkSkillToEvidence } from '../evidence/evidenceService'
import { evidenceTypeLabels, type EvidenceRecord } from '../evidence/evidenceSchema'
import { parseGitHubRepositoryUrl } from '../evidence/githubRepository'
import { extractSkills, ExtractionError } from './extractionService'
import {
  extractionRequestSchema,
  MAX_EXTRACTION_INPUT_CHARS,
  type ExtractionResponse,
  type SkillSuggestion,
} from './extractionSchema'

type SourceMode = 'text' | 'evidence'

function getEvidenceAnalysisIssue(item: EvidenceRecord): string | null {
  if (item.evidence_type === 'document') {
    return item.storage_path && item.mime_type === 'application/pdf'
      ? null
      : 'Only an uploaded PDF can be analyzed'
  }
  if (item.evidence_type === 'github_url') {
    return parseGitHubRepositoryUrl(item.source_url ?? '')
      ? null
      : 'Enter a public GitHub repository URL'
  }
  const length = item.description?.trim().length ?? 0
  if (length < 20) return 'Add at least 20 characters to the description'
  if (length > MAX_EXTRACTION_INPUT_CHARS) return 'Description exceeds the analysis limit'
  return null
}

export function SkillExtractionPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [sourceMode, setSourceMode] = useState<SourceMode>(
    () => searchParams.get('evidence') ? 'evidence' : 'text',
  )
  const [text, setText] = useState('')
  const [consentToExternalAi, setConsentToExternalAi] = useState(false)
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(
    () => searchParams.get('evidence') ?? '',
  )
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([])
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractionResponse | null>(null)
  const [runId, setRunId] = useState(0)
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    if (!user) return
    let active = true
    listEvidence(user.id)
      .then((items) => {
        if (active) setEvidence(items)
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(displayDatabaseError(cause))
      })
      .finally(() => {
        if (active) setIsLoadingEvidence(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const handleAnalyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const request = sourceMode === 'text'
      ? { source: 'text' as const, text }
      : { source: 'evidence' as const, evidence_id: selectedEvidenceId, consent_to_ai_processing: true as const }
    const validated = extractionRequestSchema.safeParse(request)

    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? 'Provide text or select an evidence item.')
      return
    }
    if (
      sourceMode === 'evidence' &&
      selectedEvidence &&
      ['document', 'github_url'].includes(selectedEvidence.evidence_type) &&
      !consentToExternalAi
    ) {
      setError('Confirm that this PDF text or public GitHub evidence may be sent to Gemini for analysis.')
      return
    }

    setIsProcessing(true)
    try {
      const extraction = await extractSkills(validated.data)
      setResult(extraction)
      setRunId((current) => current + 1)
      setSavedCount(0)
    } catch (cause) {
      const message = cause instanceof ExtractionError
        ? cause.message
        : displayDatabaseError(cause)
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveSuggestion = async (
    suggestion: SkillSuggestion,
    draft: SkillInput,
  ): Promise<string | undefined> => {
    if (!user) throw new Error('Sign in before saving a suggested skill.')
    const validatedDraft = skillSchema.safeParse(draft)
    if (!validatedDraft.success) {
      throw new Error(validatedDraft.error.issues[0]?.message ?? 'Review the skill details and try again.')
    }
    const skill = await createSkill(
      user.id,
      validatedDraft.data,
      initialProfileName(user),
      'ai_suggestion',
    )
    setSavedCount((count) => count + 1)

    if (sourceMode === 'evidence' && selectedEvidenceId) {
      try {
        await linkSkillToEvidence(
          user.id,
          skill.id,
          selectedEvidenceId,
          `AI suggestion based on user-provided evidence. Source excerpt: “${suggestion.evidence_snippet}”`.slice(0, 400),
        )
      } catch (cause) {
        return `Skill saved, but its evidence link could not be created: ${displayDatabaseError(cause)}`
      }
    }

    return undefined
  }

  const availableEvidence = evidence.filter((item) => !getEvidenceAnalysisIssue(item))
  const selectedEvidence = evidence.find((item) => item.id === selectedEvidenceId)
  const selectedEvidenceIssue = selectedEvidence
    ? getEvidenceAnalysisIssue(selectedEvidence)
    : 'Select an evidence item'
  const selectedEvidenceReady = Boolean(selectedEvidence && !selectedEvidenceIssue)
  const requiresExternalConsent =
    selectedEvidence?.evidence_type === 'document' ||
    selectedEvidence?.evidence_type === 'github_url'
  const inputLength = sourceMode === 'text' ? text.length : undefined

  return (
    <PageContainer className="max-w-5xl py-8 sm:py-12">
      <PageHeading
        title="Find possible skills in your work"
        description="AI can suggest skills from text you choose to share. Review every suggestion; nothing is added to your profile unless you approve it."
      />

      <div className="mb-6 rounded-xl border border-teal/20 bg-teal/5 p-4 text-sm leading-6 text-navy">
        <strong>Privacy and limits:</strong> Text you submit is sent to Gemini and is not stored in your Joby AI database. For PDFs, only a bounded amount of text is extracted from the private file for this request; scanned-image OCR is not supported. For GitHub, only public repository metadata and the root README are retrieved through GitHub’s API. Submitted code is never fetched or executed. Do not include passwords, identity numbers, or information you do not want processed by the AI provider.
      </div>

      {loadError && <div className="mb-5"><ErrorState>{loadError}</ErrorState></div>}
      {error && <div className="mb-5"><ErrorState>{error}</ErrorState></div>}
      {savedCount > 0 && (
        <div className="mb-5">
          <SuccessState>
            {savedCount} {savedCount === 1 ? 'approved skill has' : 'approved skills have'} been saved. AI suggestions are not verified qualifications.
            {' '}<Link to="/skills" className="font-bold underline">View your skills</Link>
          </SuccessState>
        </div>
      )}

      <Card className="p-5 shadow-card sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal">
            <Sparkles size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy">Choose what to analyze</h2>
            <p className="mt-1 text-sm leading-6 text-slatebody">
              Share a work description or select evidence with a written description. This is skill discovery, not verification.
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleAnalyze} noValidate>
          <fieldset>
            <legend className="text-sm font-semibold text-navy">Source</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${sourceMode === 'text' ? 'border-teal bg-teal/5 text-navy' : 'border-navy/15 bg-white text-slatebody'}`}>
                <input
                  type="radio"
                  name="source-mode"
                  value="text"
                  checked={sourceMode === 'text'}
                  onChange={() => { setSourceMode('text'); setError(null) }}
                  className="h-4 w-4 accent-teal"
                />
                Paste work-related text
              </label>
              <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${sourceMode === 'evidence' ? 'border-teal bg-teal/5 text-navy' : 'border-navy/15 bg-white text-slatebody'}`}>
                <input
                  type="radio"
                  name="source-mode"
                  value="evidence"
                  checked={sourceMode === 'evidence'}
                  onChange={() => { setSourceMode('evidence'); setError(null) }}
                  className="h-4 w-4 accent-teal"
                />
                Use saved evidence
              </label>
            </div>
          </fieldset>

          {sourceMode === 'text' ? (
            <div>
              <label htmlFor="extraction-text" className="block text-sm font-semibold text-navy">
                Work sample or project description
              </label>
              <textarea
                id="extraction-text"
                name="text"
                rows={8}
                maxLength={MAX_EXTRACTION_INPUT_CHARS}
                value={text}
                onChange={(event) => { setText(event.target.value); setError(null) }}
                placeholder="Describe a project or work sample, what you contributed, and the tools or methods you used."
                aria-describedby="extraction-text-hint extraction-text-count"
                className="mt-2 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-3 text-base text-navy outline-none placeholder:text-slatebody/60 focus:border-teal focus:ring-4 focus:ring-teal/10"
              />
              <div className="mt-2 flex flex-col gap-1 text-xs text-slatebody sm:flex-row sm:justify-between">
                <p id="extraction-text-hint">Only the text above is sent for analysis. Avoid sensitive details.</p>
                <p id="extraction-text-count" aria-live="polite">
                  {inputLength?.toLocaleString()} / {MAX_EXTRACTION_INPUT_CHARS.toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="evidence-selection" className="block text-sm font-semibold text-navy">
              Evidence item
              </label>
              {isLoadingEvidence ? (
                <div className="mt-2"><LoadingState label="Loading your evidence..." /></div>
              ) : (
                <>
                  <select
                    id="evidence-selection"
                    name="evidence_id"
                    value={selectedEvidenceId}
                    onChange={(event) => {
                      setSelectedEvidenceId(event.target.value)
                      setConsentToExternalAi(false)
                      setError(null)
                    }}
                    disabled={Boolean(loadError)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
                  >
                    <option value="">Choose evidence to analyze</option>
                    {evidence.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                        disabled={Boolean(getEvidenceAnalysisIssue(item))}
                      >
                        {item.title} — {getEvidenceAnalysisIssue(item) ?? evidenceTypeLabels[item.evidence_type]}
                      </option>
                    ))}
                  </select>
                  {availableEvidence.length === 0 && (
                    <p className="mt-2 text-sm text-slatebody">
                      No saved evidence is ready for analysis. Add a sufficiently detailed description, upload a PDF, or save a public GitHub repository.{' '}
                      <Link to="/evidence" className="font-semibold text-teal-700 underline">Add or edit evidence</Link>
                      {' '}or switch to pasted text.
                    </p>
                  )}
                  {selectedEvidenceId && selectedEvidence && selectedEvidenceIssue && (
                    <p className="mt-2 text-sm text-warning">
                      {selectedEvidenceIssue}.
                    </p>
                  )}
                  {selectedEvidence && selectedEvidenceReady && selectedEvidence.evidence_type === 'github_url' && (
                    <p className="mt-2 text-sm leading-6 text-slatebody">
                      Only the public repository metadata and root README are retrieved. Other files are not fetched, code is not executed, and authorship is not verified.
                    </p>
                  )}
                  {selectedEvidence && selectedEvidenceReady && selectedEvidence.evidence_type === 'document' && (
                    <p className="mt-2 text-sm leading-6 text-slatebody">
                      The PDF remains in private storage. Its bounded extracted text is sent to Gemini for this request only; it is not saved to your evidence record.
                    </p>
                  )}
                  {selectedEvidence && selectedEvidenceReady &&
                    !['document', 'github_url'].includes(selectedEvidence.evidence_type) && (
                    <p className="mt-2 text-sm leading-6 text-slatebody">
                      Only your saved description is sent. The source URL and private file are not fetched or included.
                    </p>
                  )}
                  {requiresExternalConsent && selectedEvidenceReady && (
                    <label className="mt-4 flex items-start gap-3 rounded-lg border border-navy/10 bg-warm p-4 text-sm leading-6 text-navy">
                      <input
                        type="checkbox"
                        checked={consentToExternalAi}
                        onChange={(event) => setConsentToExternalAi(event.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-navy/30 text-teal focus:ring-teal"
                      />
                      <span>
                        I agree to send {selectedEvidence.evidence_type === 'document'
                          ? 'text extracted from this private PDF'
                          : 'the retrieved public repository README and metadata'} to Gemini for skill suggestions.
                      </span>
                    </label>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-navy/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slatebody">
              Up to 5 requests per hour. Gemini output can be inaccurate.
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={
                isProcessing ||
                (sourceMode === 'evidence' &&
                  (isLoadingEvidence ||
                    Boolean(loadError) ||
                    !selectedEvidenceReady ||
                    (requiresExternalConsent && !consentToExternalAi)))
              }
            >
              {isProcessing
                ? <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
                : <Sparkles size={18} aria-hidden="true" />}
              {isProcessing ? 'Analyzing...' : 'Analyze for skills'}
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <section className="mt-8 space-y-6" aria-labelledby="extraction-results-heading">
          <div>
            <h2 id="extraction-results-heading" className="text-2xl font-bold text-navy">Review AI suggestions</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slatebody">
              These are possibilities inferred from the submitted text, not verified skills or qualifications. Choose which, if any, to save.
            </p>
          </div>

          {result.source_info.availability !== 'available' && (
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm leading-6 text-navy" role="status">
              {result.source_info.availability === 'unavailable'
                ? 'The selected source was unavailable, so no content was analyzed.'
                : 'The retrieved source did not contain enough evidence for skill suggestions.'}
            </div>
          )}
          {result.source_info.repository_url && (
            <p className="text-sm text-slatebody">
              Public repository analyzed:{' '}
              <a
                href={result.source_info.repository_url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-teal-700 underline"
              >
                {result.source_info.repository_url}
              </a>
            </p>
          )}
          {result.source_info.preview && (
            <details className="rounded-xl border border-navy/10 bg-white p-4">
              <summary className="cursor-pointer font-semibold text-navy">
                Review {result.source_info.source_type === 'pdf'
                  ? 'the extracted PDF text'
                  : result.source_info.source_type === 'github'
                    ? 'the retrieved README text'
                    : 'the analyzed text'}
              </summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-warm p-4 text-xs leading-5 text-slatebody">
                {result.source_info.preview}
              </pre>
            </details>
          )}

          {result.experience_summary.length > 0 && (
            <Card className="p-5 shadow-card sm:p-6">
              <h3 className="font-bold text-navy">Experience statements in the text</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slatebody">
                {result.experience_summary.map((summary, index) => <li key={`${runId}-summary-${index}`}>{summary}</li>)}
              </ul>
            </Card>
          )}

          {result.limitations.length > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
              <h3 className="flex items-center gap-2 font-bold text-navy">
                <AlertTriangle size={18} className="text-warning" aria-hidden="true" />
                Limitations and uncertainty
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slatebody">
                {result.limitations.map((limitation, index) => <li key={`${runId}-limitation-${index}`}>{limitation}</li>)}
              </ul>
            </div>
          )}

          {result.skills.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {result.skills.map((suggestion, index) => (
                <SuggestionReviewCard
                  key={`${runId}-${index}`}
                  suggestion={suggestion}
                  onSave={handleSaveSuggestion}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No specific skills could be suggested">
              <p>The text may not include enough concrete examples. Add more detail about actions, tools, or work you completed, then try again.</p>
            </EmptyState>
          )}
        </section>
      )}
    </PageContainer>
  )
}

function SuggestionReviewCard({
  suggestion,
  onSave,
}: {
  suggestion: SkillSuggestion
  onSave: (suggestion: SkillSuggestion, draft: SkillInput) => Promise<string | undefined>
}) {
  const fieldId = useId()
  const [name, setName] = useState(suggestion.name)
  const [category, setCategory] = useState(suggestion.category)
  const [description, setDescription] = useState(suggestion.evidence_snippet.slice(0, 400))
  const [proficiency, setProficiency] = useState<SkillInput['self_reported_level']>('unsure')
  const [isEditing, setIsEditing] = useState(false)
  const [status, setStatus] = useState<'review' | 'saved' | 'rejected'>('review')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const acceptSuggestion = async () => {
    setError(null)
    setWarning(null)
    const draft: SkillInput = {
      name,
      category,
      description,
      self_reported_level: proficiency,
    }
    setIsSaving(true)
    try {
      const saveWarning = await onSave(suggestion, draft)
      setWarning(saveWarning ?? null)
      setStatus('saved')
    } catch (cause) {
      setError(displayDatabaseError(cause))
    } finally {
      setIsSaving(false)
    }
  }

  const rejectSuggestion = () => {
    setStatus('rejected')
    setIsEditing(false)
    setError(null)
    setWarning(null)
  }

  return (
    <Card className="flex h-full flex-col p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="Edit suggested skill name"
                name="suggestion-name"
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                label="Edit category"
                name="suggestion-category"
                maxLength={60}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>
          ) : (
            <>
              <h3 className="break-words text-lg font-bold text-navy">{name}</h3>
              <p className="mt-1 text-sm text-slatebody">{category || 'Category not specified'}</p>
            </>
          )}
        </div>
        <Badge tone={suggestion.confidence < 0.5 ? 'warm' : 'teal'}>
          Confidence estimate: {Math.round(suggestion.confidence * 100)}%
        </Badge>
      </div>

      <div className="mt-4 rounded-lg border-l-4 border-teal bg-teal/5 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-navy">Source excerpt</p>
        <blockquote className="mt-2 text-sm leading-6 text-slatebody">“{suggestion.evidence_snippet}”</blockquote>
      </div>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-navy">Why this may indicate the skill</p>
        <p className="mt-2 text-sm leading-6 text-slatebody">{suggestion.reasoning}</p>
      </div>

      {status === 'review' && (
        <>
          {isEditing && (
            <div className="mt-4">
              <label htmlFor={`${fieldId}-description`} className="block text-sm font-semibold text-navy">
                Skill description (optional)
              </label>
              <textarea
                id={`${fieldId}-description`}
                rows={3}
                maxLength={400}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-3 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
              />
            </div>
          )}

          <div className="mt-4">
            <label htmlFor={`${fieldId}-level`} className="block text-sm font-semibold text-navy">
              Your self-reported proficiency
            </label>
            <select
              id={`${fieldId}-level`}
              value={proficiency}
              onChange={(event) => {
                const level = proficiencyLevels.find((option) => option === event.target.value)
                if (level) setProficiency(level)
              }}
              className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
            >
              <option value="unsure">Not sure</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <p className="mt-1 text-xs text-slatebody">AI does not choose or verify your proficiency.</p>
          </div>
        </>
      )}

      {error && <div className="mt-4"><ErrorState>{error}</ErrorState></div>}
      {warning && <div className="mt-4"><ErrorState>{warning}</ErrorState></div>}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-navy/10 pt-5 mt-5">
        {status === 'review' ? (
          <>
            <Button onClick={acceptSuggestion} disabled={isSaving}>
              {isSaving
                ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
                : <Check size={16} aria-hidden="true" />}
              {isEditing ? 'Save edited skill' : 'Accept & save'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (isEditing) {
                  setName(suggestion.name)
                  setCategory(suggestion.category)
                  setDescription(suggestion.evidence_snippet.slice(0, 400))
                }
                setIsEditing((editing) => !editing)
              }}
              disabled={isSaving}
            >
              {isEditing ? 'Cancel edits' : 'Edit'}
            </Button>
            <Button variant="ghost" onClick={rejectSuggestion} disabled={isSaving}>
              <X size={16} aria-hidden="true" />
              Reject
            </Button>
          </>
        ) : status === 'saved' ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-success" role="status">
            <Check size={17} aria-hidden="true" />
            Saved as an AI suggestion — not verified
          </p>
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-sm text-slatebody" role="status">Rejected; nothing was saved.</p>
            <Button variant="ghost" onClick={() => setStatus('review')}>
              <RotateCcw size={15} aria-hidden="true" />
              Review again
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
