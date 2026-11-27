import { AlertTriangle, ExternalLink, Printer, Send } from '../../components/ui/icons'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../../components/ui/Feedback'
import { JobyLogo } from '../../components/ui/JobyLogo'
import { PageContainer } from '../../components/layout/PageContainer'
import { EvidenceStatusBadge } from '../../components/ui/EvidenceStatusBadge'
import { displayDatabaseError } from '../../lib/displayErrors'
import {
  getPublicPassport,
  submitPassportCorrectionRequest,
} from './passportService'
import {
  passportCorrectionRequestSchema,
  type PublicPassport,
  type PublicPassportEvidence,
} from './passportSchema'
import { PassportStatusExplainer } from './PassportStatusExplainer'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function evidenceKindLabel(type: PublicPassportEvidence['evidence_type']) {
  switch (type) {
    case 'project_url': return 'Project URL'
    case 'github_url': return 'GitHub repository'
    case 'document': return 'Document submitted'
    case 'text_sample': return 'Text sample'
  }
}

function PublicEvidenceCard({ evidence }: { evidence: PublicPassportEvidence }) {
  return (
    <Card as="article" className="p-4 shadow-card print:break-inside-avoid">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="break-words font-bold text-navy">{evidence.title}</h4>
        <Badge tone="slate">{evidenceKindLabel(evidence.evidence_type)}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <EvidenceStatusBadge label="Evidence submitted" />
        {evidence.human_reviewed && <EvidenceStatusBadge label="Human reviewed" />}
        {evidence.external_credential_verified && <EvidenceStatusBadge label="External credential" />}
      </div>
      {evidence.description && (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slatebody">{evidence.description}</p>
      )}
      {evidence.source_url && (
        <a
          href={evidence.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-10 items-center gap-2 break-all text-sm font-semibold text-teal-700 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          View source
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      )}
      {evidence.evidence_type === 'document' && (
        <p className="mt-3 text-xs leading-5 text-slatebody">
          The uploaded file remains private and is not included in this passport.
        </p>
      )}
      <p className="mt-3 text-xs text-slatebody">Submitted {formatDate(evidence.submitted_at)}</p>
    </Card>
  )
}

export function PublicPassportPage() {
  const { slug = '' } = useParams()
  const [passport, setPassport] = useState<PublicPassport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const latest = await getPublicPassport(slug)
        if (active) {
          setPassport(latest)
          setLoadError(null)
        }
      } catch {
        if (active) {
          setLoadError('This passport could not be loaded right now. Please try again.')
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    setIsLoading(true)
    void load()
    const intervalId = window.setInterval(() => { void load() }, 15_000)
    window.addEventListener('focus', load)
    return () => {
      active = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', load)
    }
  }, [slug, reloadKey])

  const handleCorrectionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    const parsed = passportCorrectionRequestSchema.safeParse({
      message,
      contact_email: contactEmail,
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Review the request and try again.')
      return
    }

    setIsSubmitting(true)
    try {
      await submitPassportCorrectionRequest(
        slug,
        parsed.data.message,
        parsed.data.contact_email,
      )
      setMessage('')
      setContactEmail('')
      setFormSuccess('Your correction request was saved for review.')
    } catch (cause) {
      setFormError(displayDatabaseError(cause))
    } finally {
      setIsSubmitting(false)
    }
  }

  const retryLoad = () => {
    setIsLoading(true)
    setLoadError(null)
    setReloadKey((key) => key + 1)
  }

  if (isLoading) {
    return <PageContainer className="max-w-4xl py-10"><LoadingState label="Loading public passport..." /></PageContainer>
  }

  if (loadError) {
    return (
      <PageContainer className="max-w-3xl py-10">
        <ErrorState>{loadError}</ErrorState>
        <Button className="mt-4 print:hidden" variant="secondary" onClick={retryLoad}>Try again</Button>
      </PageContainer>
    )
  }

  if (!passport) {
    return (
      <PageContainer className="max-w-3xl py-10">
        <EmptyState title="This passport is not available">
          <p>The link may be incorrect, or its owner may have turned off sharing.</p>
          <Link to="/" className="mt-4 inline-flex min-h-10 items-center font-semibold text-teal-700">Back to Joby AI</Link>
        </EmptyState>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="max-w-5xl py-8 sm:py-12 print:max-w-none print:px-0 print:py-0">
      <a
        href="#public-passport-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-white px-4 py-3 font-semibold text-navy shadow-soft focus:not-sr-only focus:outline focus:outline-2 focus:outline-teal print:hidden"
      >
        Skip to passport content
      </a>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/" className="inline-flex min-h-10 items-center gap-2 font-bold text-navy">
          <JobyLogo className="h-8 w-8" />
          Joby AI Skills Passport
        </Link>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={17} aria-hidden="true" />
          Print / Save as PDF
        </Button>
      </header>

      <main id="public-passport-content" tabIndex={-1}>
        <Card as="section" aria-labelledby="public-passport-name" className="mb-6 p-6 shadow-card sm:p-9 print:border-0 print:p-0 print:shadow-none">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-teal-700">Skills Passport</p>
          <h1 id="public-passport-name" className="mt-3 break-words text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            {passport.display_name}
          </h1>
          {passport.headline && <p className="mt-3 text-xl text-slatebody">{passport.headline}</p>}
          {passport.bio && <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-slatebody">{passport.bio}</p>}
          <p className="mt-6 border-t border-navy/10 pt-4 text-xs text-slatebody">
            Last updated {formatDate(passport.last_updated_at)}
          </p>
        </Card>

        <section aria-labelledby="public-skills-heading" className="mb-8">
          <h2 id="public-skills-heading" className="mb-4 text-xl font-bold text-navy">Skills and supporting evidence</h2>
          {passport.skills.length ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {passport.skills.map((skill, index) => (
                <li key={`${skill.name}-${index}`}>
                  <Card as="article" className="h-full p-5 shadow-card print:break-inside-avoid print:shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-navy">{skill.name}</h3>
                        {skill.category && <p className="mt-1 text-sm text-slatebody">{skill.category}</p>}
                      </div>
                      <Badge tone={skill.status_labels.includes('Verified') ? 'teal' : 'slate'}>{({
                        beginner: 'Beginner',
                        intermediate: 'Intermediate',
                        advanced: 'Advanced',
                        expert: 'Expert',
                        unsure: 'Not sure',
                      })[skill.proficiency]}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skill.status_labels.filter((label) => label !== 'Verified').map((label) => (
                        <EvidenceStatusBadge key={label} label={label} />
                      ))}
                      {skill.status_labels.includes('Verified') && <Badge tone="teal">Verified skill</Badge>}
                    </div>
                    {skill.evidence.length ? (
                      <ul className="mt-4 space-y-3 border-t border-navy/10 pt-4">
                        {skill.evidence.map((evidence, evidenceIndex) => (
                          <li key={`${evidence.title}-${evidence.submitted_at}-${evidenceIndex}`}>
                            <PublicEvidenceCard evidence={evidence} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-slatebody">No public supporting evidence has been selected for this skill.</p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No skills are listed">No skills have been shared on this passport.</EmptyState>
          )}
        </section>

        {passport.credentials.length > 0 && (
          <section aria-labelledby="public-credentials-heading" className="mb-8">
            <h2 id="public-credentials-heading" className="mb-4 text-xl font-bold text-navy">Credentials</h2>
            <ul className="grid gap-4 md:grid-cols-2">{passport.credentials.map((credential, index) => (
              <li key={`${credential.title}-${credential.issuer_name}-${index}`}>
                <Card as="article" className="h-full p-5 shadow-card print:break-inside-avoid">
                  <h3 className="font-bold text-navy">{credential.title}</h3>
                  <p className="mt-1 text-sm text-slatebody">{credential.issuer_name} · {credential.credential_type.replace(/_/g, ' ')}</p>
                  <p className="mt-2 text-xs capitalize text-slatebody">{credential.status.replace(/_/g, ' ')}{credential.issued_at ? ` · Issued ${formatDate(credential.issued_at)}` : ''}{credential.expires_at ? ` · Expires ${formatDate(credential.expires_at)}` : ''}</p>
                </Card>
              </li>
            ))}</ul>
          </section>
        )}

        {passport.experience.length > 0 && (
          <section aria-labelledby="public-experience-heading" className="mb-8">
            <h2 id="public-experience-heading" className="mb-4 text-xl font-bold text-navy">Experience</h2>
            <ul className="space-y-3">{passport.experience.map((item, index) => (
              <li key={`${item.title}-${item.started_at}-${index}`}>
                <Card as="article" className="p-5 shadow-card print:break-inside-avoid">
                  <h3 className="font-bold text-navy">{item.title}{item.organization ? ` · ${item.organization}` : ''}</h3>
                  <p className="mt-1 text-sm capitalize text-slatebody">{item.experience_type}{item.started_at ? ` · ${item.started_at}` : ''}{item.is_current ? ' · Current' : item.ended_at ? ` – ${item.ended_at}` : ''}</p>
                  {item.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slatebody">{item.description}</p>}
                </Card>
              </li>
            ))}</ul>
          </section>
        )}

        {passport.other_evidence.length > 0 && (
          <section aria-labelledby="public-other-evidence-heading" className="mb-8">
            <h2 id="public-other-evidence-heading" className="mb-4 text-xl font-bold text-navy">Additional shared evidence</h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {passport.other_evidence.map((evidence, index) => (
                <li key={`${evidence.title}-${evidence.submitted_at}-${index}`}>
                  <PublicEvidenceCard evidence={evidence} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="public-assessments-heading" className="mb-8">
          <div className="mb-4">
            <h2 id="public-assessments-heading" className="text-xl font-bold text-navy">Completed assessments</h2>
            <p className="mt-1 text-sm leading-6 text-slatebody">
              Only rubric scores are shown. Assessment submissions and written feedback remain private.
            </p>
          </div>
          {passport.assessments.length ? (
            <ul className="space-y-4">
              {passport.assessments.map((assessment, index) => (
                <li key={`${assessment.title}-${assessment.completed_at}-${index}`}>
                  <Card as="article" className="p-5 shadow-card sm:p-6 print:break-inside-avoid print:shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-navy">{assessment.title}</h3>
                        <p className="mt-1 text-sm capitalize text-slatebody">{assessment.category.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-navy">
                          {assessment.score} <span className="text-sm font-medium text-slatebody">/ {assessment.max_score}</span>
                        </p>
                        <EvidenceStatusBadge label={assessment.method_label} />
                      </div>
                    </div>
                    <ul className="mt-4 divide-y divide-navy/10 border-t border-navy/10">
                      {assessment.criteria.map((criterion) => (
                        <li key={criterion.criterion} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <span className="text-sm font-semibold text-navy">{criterion.criterion}</span>
                          <Badge tone="teal">{criterion.score} / {criterion.max_score}</Badge>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-slatebody">Completed {formatDate(assessment.completed_at)}</p>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No completed assessments shared">Completed results will appear here when available.</EmptyState>
          )}
        </section>

        <div className="mb-8">
          <PassportStatusExplainer />
        </div>

        <Card as="section" aria-labelledby="passport-correction-heading" className="p-5 shadow-card sm:p-6 print:hidden">
          <div className="flex items-start gap-3">
            <AlertTriangle size={19} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            <div className="w-full">
              <h2 id="passport-correction-heading" className="font-bold text-navy">Report an issue or request a correction</h2>
              <p className="mt-1 text-sm leading-6 text-slatebody">
                This request is saved privately for review. It does not notify the passport owner automatically. Do not include passwords, identity documents, or other sensitive information.
              </p>
              <form className="mt-4 space-y-4" onSubmit={handleCorrectionSubmit} noValidate>
                {formError && <ErrorState>{formError}</ErrorState>}
                {formSuccess && <SuccessState>{formSuccess}</SuccessState>}
                <div>
                  <label htmlFor="passport-correction-message" className="block text-sm font-semibold text-navy">
                    What should be corrected?
                  </label>
                  <textarea
                    id="passport-correction-message"
                    rows={4}
                    maxLength={2000}
                    required
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="mt-2 min-h-28 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-3 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
                  />
                </div>
                <div>
                  <label htmlFor="passport-correction-email" className="block text-sm font-semibold text-navy">
                    Your email (optional)
                  </label>
                  <input
                    id="passport-correction-email"
                    type="email"
                    maxLength={254}
                    autoComplete="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10 sm:max-w-md"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  <Send size={16} aria-hidden="true" />
                  {isSubmitting ? 'Saving request...' : 'Submit correction request'}
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </main>

      <footer className="mt-8 border-t border-navy/10 pt-5 text-center text-xs text-slatebody print:mt-4">
        Joby AI Skills Passport · AI-assisted assessments are advisory and are not official certification.
      </footer>
    </PageContainer>
  )
}
