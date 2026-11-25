import { AlertTriangle, Copy, ExternalLink, Eye, EyeOff, FileText, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../../components/ui/Feedback'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { EvidenceStatusBadge } from '../../components/ui/EvidenceStatusBadge'
import { VisibilityToggle } from '../../components/ui/VisibilityToggle'
import { displayDatabaseError } from '../../lib/displayErrors'
import { proficiencyLabels } from '../skills/skillSchema'
import { useAuth } from '../auth/useAuth'
import {
  getPrivatePassport,
  setPassportEvidenceVisibility,
  setPassportSharing,
  type PrivatePassport,
} from './passportService'
import { PassportStatusExplainer } from './PassportStatusExplainer'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function evidenceKindLabel(type: string) {
  switch (type) {
    case 'project_url': return 'Project URL'
    case 'github_url': return 'GitHub repository'
    case 'document': return 'Private file'
    case 'text_sample': return 'Text sample'
    default: return 'Evidence'
  }
}

export function PassportPage() {
  const { user } = useAuth()
  const [passport, setPassport] = useState<PrivatePassport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [visibilityBusyId, setVisibilityBusyId] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadPassport = useCallback(async () => {
    if (!user) return
    const result = await getPrivatePassport(user.id)
    setPassport(result)
  }, [user])

  useEffect(() => {
    let active = true
    if (!user) return
    getPrivatePassport(user.id)
      .then((result) => {
        if (active) setPassport(result)
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
  }, [user])

  const reload = async () => {
    setLoadError(null)
    setIsLoading(true)
    try {
      await loadPassport()
    } catch (cause) {
      setLoadError(displayDatabaseError(cause))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSharing = async (nextValue: boolean) => {
    if (!user || !passport) return
    setPageError(null)
    setSuccess(null)
    setCopyError(null)
    setIsSharing(true)
    try {
      const state = await setPassportSharing(user.id, nextValue)
      setPassport((current) => current
        ? { ...current, profile: { ...current.profile, ...state } }
        : current)
      setSuccess(state.is_public
        ? 'Public sharing is on. Your link is ready.'
        : 'Public sharing is off. The public link has been revoked.')
      await loadPassport()
    } catch (cause) {
      setPageError(displayDatabaseError(cause))
    } finally {
      setIsSharing(false)
    }
  }

  const handleEvidenceVisibility = async (evidenceId: string, visibility: 'private' | 'public') => {
    if (!user) return
    setPageError(null)
    setSuccess(null)
    setVisibilityBusyId(evidenceId)
    try {
      await setPassportEvidenceVisibility(user.id, evidenceId, visibility)
      setPassport((current) => current
        ? {
            ...current,
            evidence: current.evidence.map((item) => item.id === evidenceId
              ? { ...item, visibility }
              : item),
            lastUpdatedAt: new Date().toISOString(),
          }
        : current)
      setSuccess(visibility === 'public'
        ? 'Evidence summary will appear on your public passport when sharing is enabled. Files remain private.'
        : 'Evidence is private and no longer appears on your public passport.')
    } catch (cause) {
      setPageError(displayDatabaseError(cause))
    } finally {
      setVisibilityBusyId(null)
    }
  }

  const handleCopyLink = async () => {
    if (!passport?.profile.public_slug) return
    setCopyError(null)
    setCopied(false)
    try {
      await navigator.clipboard.writeText(
        new URL(`/p/${passport.profile.public_slug}`, window.location.origin).toString(),
      )
      setCopied(true)
    } catch {
      setCopyError('Could not access the clipboard. You can copy the link from the field below.')
    }
  }

  if (isLoading) {
    return <PageContainer className="py-10"><LoadingState label="Loading your private Skills Passport..." /></PageContainer>
  }

  if (loadError) {
    return (
      <PageContainer className="max-w-3xl py-10">
        <ErrorState>{loadError}</ErrorState>
        <Button className="mt-4" variant="secondary" onClick={reload}>Reload passport</Button>
      </PageContainer>
    )
  }

  if (!passport) {
    return (
      <PageContainer className="max-w-3xl py-10">
        <EmptyState title="Your profile is not ready yet">
          <p>Complete your profile before previewing a Skills Passport.</p>
          <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-teal-700" to="/profile">
            Open your profile
          </Link>
        </EmptyState>
      </PageContainer>
    )
  }

  const publicUrl = passport.profile.is_public && passport.profile.public_slug
    ? new URL(`/p/${passport.profile.public_slug}`, window.location.origin).toString()
    : null

  return (
    <PageContainer className="max-w-5xl py-8 sm:py-12">
      <PageHeading
        title="Your Skills Passport"
        description="Preview the information you can choose to share. Your private files and assessment submissions are never included."
      />

      {pageError && <div className="mb-5"><ErrorState>{pageError}</ErrorState></div>}
      {success && <div className="mb-5"><SuccessState>{success}</SuccessState></div>}
      {passport.invalidAssessmentCount > 0 && (
        <div className="mb-5">
          <ErrorState>
            {passport.invalidAssessmentCount} completed assessment result{passport.invalidAssessmentCount === 1 ? '' : 's'} failed validation and were omitted. No score was shown.
          </ErrorState>
        </div>
      )}

      <Card as="section" aria-labelledby="passport-sharing-heading" className="mb-6 p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              {passport.profile.is_public
                ? <Eye size={19} className="text-teal" aria-hidden="true" />
                : <EyeOff size={19} className="text-slatebody" aria-hidden="true" />}
              <h2 id="passport-sharing-heading" className="text-lg font-bold text-navy">
                {passport.profile.is_public ? 'Public sharing is on' : 'Your passport is private'}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slatebody">
              When enabled, your name, headline, bio, skills, explicitly public evidence summaries, and completed rubric scores are visible to anyone with the link. Email, account identifiers, private files, reviewer notes, and assessment submissions are excluded.
            </p>
          </div>
          <VisibilityToggle
            checked={passport.profile.is_public}
            busy={isSharing}
            label="Public Skills Passport sharing"
            onChange={handleSharing}
          />
        </div>

        {publicUrl && (
          <div className="mt-5 border-t border-navy/10 pt-5">
            <label htmlFor="public-passport-link" className="block text-sm font-semibold text-navy">
              Your public link
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="public-passport-link"
                readOnly
                value={publicUrl}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-navy/15 bg-slate-50 px-3 text-sm text-navy"
              />
              <Button variant="secondary" onClick={handleCopyLink}>
                <Copy size={17} aria-hidden="true" />
                Copy link
              </Button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-navy hover:bg-navy/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                <ExternalLink size={17} aria-hidden="true" />
                Preview
              </a>
            </div>
            {copied && <p className="mt-2 text-sm text-success" role="status">Link copied.</p>}
            {copyError && <p className="mt-2 text-sm text-error" role="alert">{copyError}</p>}
          </div>
        )}
      </Card>

      <Card as="section" aria-labelledby="passport-profile-heading" className="mb-6 p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="passport-profile-heading" className="text-2xl font-bold text-navy">
              {passport.profile.display_name}
            </h2>
            {passport.profile.headline && <p className="mt-2 text-lg text-teal-700">{passport.profile.headline}</p>}
            {passport.profile.bio && <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-slatebody">{passport.profile.bio}</p>}
          </div>
          <Link to="/profile" className="inline-flex min-h-10 items-center text-sm font-semibold text-teal-700 hover:text-navy">
            Edit profile
          </Link>
        </div>
        <p className="mt-5 border-t border-navy/10 pt-4 text-xs text-slatebody">
          Passport updated {formatDate(passport.lastUpdatedAt)}
        </p>
      </Card>

      <section aria-labelledby="passport-skills-heading" className="mb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="passport-skills-heading" className="text-xl font-bold text-navy">Skills</h2>
            <p className="mt-1 text-sm text-slatebody">Proficiency is self-selected and shown separately from assessment scores.</p>
          </div>
          <Link to="/skills" className="text-sm font-semibold text-teal-700 hover:text-navy">Manage skills</Link>
        </div>
        {passport.skills.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {passport.skills.map((skill) => {
              const skillEvidence = passport.evidence.filter((item) =>
                item.linkedSkills.some((linkedSkill) => linkedSkill.id === skill.id))
              const isReviewed = skillEvidence.some((item) => item.reviews.length > 0)
              return (
                <li key={skill.id}>
                  <Card as="article" className="h-full p-5 shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-navy">{skill.name}</h3>
                      <Badge tone="teal">{proficiencyLabels[skill.self_reported_level]}</Badge>
                    </div>
                    {skill.category && <p className="mt-1 text-sm text-slatebody">{skill.category}</p>}
                    {skill.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slatebody">{skill.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <EvidenceStatusBadge label="Self-reported" />
                      {skillEvidence.length > 0 && <EvidenceStatusBadge label="Evidence submitted" />}
                      {isReviewed && <EvidenceStatusBadge label="Human reviewed" />}
                      {skillEvidence.some((item) => item.externalCredentials.length > 0) && (
                        <EvidenceStatusBadge label="External credential" />
                      )}
                    </div>
                    {skillEvidence.length > 0 && (
                      <ul className="mt-4 space-y-3 border-t border-navy/10 pt-4">
                        {skillEvidence.map((item) => (
                          <li key={item.id} className="text-sm">
                            <Link to={`/evidence/${item.id}`} className="font-semibold text-teal-700 hover:text-navy">
                              {item.title}
                            </Link>
                            <span className="ml-2 text-xs text-slatebody">{evidenceKindLabel(item.evidence_type)}</span>
                            {item.visibility === 'public' && <Badge className="ml-2" tone="teal">Public summary</Badge>}
                            {item.reviews.length > 0 && (
                              <p className="mt-1 text-xs text-slatebody">
                                Human review recorded; private reviewer notes are not shown.
                              </p>
                            )}
                            {item.externalCredentials.map((credential) => (
                              <p key={`${credential.provider}-${credential.credential_name}`} className="mt-1 text-xs text-slatebody">
                                External credential verified by {credential.provider} · {formatDate(credential.verified_at)}
                              </p>
                            ))}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState title="No skills to show yet">
            <p>Add a skill to build your passport.</p>
            <Link to="/skills" className="mt-3 inline-flex min-h-10 items-center font-semibold text-teal-700">Add a skill</Link>
          </EmptyState>
        )}
      </section>

      <section aria-labelledby="passport-evidence-heading" className="mb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="passport-evidence-heading" className="text-xl font-bold text-navy">Supporting evidence</h2>
            <p className="mt-1 text-sm leading-6 text-slatebody">
              Evidence is private by default. Only its title, description and approved URL can appear publicly. Uploaded files always remain private.
            </p>
          </div>
          <Link to="/evidence" className="text-sm font-semibold text-teal-700 hover:text-navy">Manage evidence</Link>
        </div>
        {passport.evidence.length ? (
          <ul className="space-y-3">
            {passport.evidence.map((item) => (
              <li key={item.id}>
                <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-bold text-navy">{item.title}</h3>
                      <Badge tone={item.visibility === 'public' ? 'teal' : 'slate'}>
                        {item.visibility === 'public' ? 'Public summary' : 'Private'}
                      </Badge>
                      {item.externalCredentials.length > 0 && (
                        <EvidenceStatusBadge label="External credential" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slatebody">{evidenceKindLabel(item.evidence_type)}</p>
                    {item.linkedSkills.length > 0 ? (
                      <p className="mt-2 text-sm text-slatebody">
                        Linked to: {item.linkedSkills.map((skill) => skill.name).join(', ')}
                      </p>
                    ) : (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                        <AlertTriangle size={14} aria-hidden="true" />
                        Link to a skill to include this evidence on the public passport.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      to={`/evidence/${item.id}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-navy/15 px-3 text-sm font-semibold text-navy hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                    >
                      <FileText size={16} aria-hidden="true" />
                      Details
                    </Link>
                    <Button
                      variant={item.visibility === 'public' ? 'secondary' : 'primary'}
                      disabled={visibilityBusyId === item.id}
                      onClick={() => handleEvidenceVisibility(
                        item.id,
                        item.visibility === 'public' ? 'private' : 'public',
                      )}
                    >
                      {visibilityBusyId === item.id
                        ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                        : item.visibility === 'public'
                          ? <EyeOff size={16} aria-hidden="true" />
                          : <Eye size={16} aria-hidden="true" />}
                      {item.visibility === 'public' ? 'Make private' : 'Share summary'}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No supporting evidence yet">
            <p>Add evidence and link it to a skill when you are ready.</p>
          </EmptyState>
        )}
      </section>

      <section aria-labelledby="passport-assessments-heading" className="mb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="passport-assessments-heading" className="text-xl font-bold text-navy">Completed assessments</h2>
            <p className="mt-1 text-sm text-slatebody">Private preview includes your rubric feedback; public sharing shows scores only, never submissions or feedback text.</p>
          </div>
          <Link to="/assessments" className="text-sm font-semibold text-teal-700 hover:text-navy">Browse assessments</Link>
        </div>
        {passport.assessments.length ? (
          <ul className="space-y-4">
            {passport.assessments.map((assessment) => (
              <li key={assessment.id}>
                <Card as="article" className="p-5 shadow-card sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-navy">{assessment.title}</h3>
                      <p className="mt-1 text-sm text-slatebody">{assessment.category.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-navy">
                        {assessment.total_score} <span className="text-sm font-medium text-slatebody">/ {assessment.max_score}</span>
                      </p>
                      <EvidenceStatusBadge
                        label={assessment.assessment_method === 'human_review'
                          ? 'Human reviewed'
                          : 'AI-assisted assessment'}
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slatebody">{assessment.overall_summary}</p>
                  <ul className="mt-4 divide-y divide-navy/10 border-t border-navy/10">
                    {assessment.criteria.map((criterion) => (
                      <li key={criterion.criterion} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <p className="text-sm font-semibold text-navy">{criterion.criterion}</p>
                          <p className="mt-1 text-sm leading-6 text-slatebody">{criterion.feedback}</p>
                        </div>
                        <Badge tone="teal">{criterion.score} / {criterion.max_score}</Badge>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-slatebody">Completed {formatDate(assessment.completed_at)} · This is not an official certification.</p>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No completed assessments yet">
            <p>Completed assessment results will appear here when available.</p>
          </EmptyState>
        )}
      </section>

      <PassportStatusExplainer />
    </PageContainer>
  )
}
