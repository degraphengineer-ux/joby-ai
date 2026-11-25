import { ArrowLeft, ExternalLink, LoaderCircle, Pencil, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../../components/ui/Feedback'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import { useAuth } from '../auth/useAuth'
import { listSkills } from '../skills/skillsService'
import type { Skill } from '../skills/skillSchema'
import { EvidenceForm } from './EvidenceForm'
import {
  evidenceTypeLabels,
  emptyEvidence,
  type EvidenceInput,
  type EvidenceRecord,
  type EvidenceSkillLink,
} from './evidenceSchema'
import {
  createEvidenceSignedUrl,
  deleteEvidence,
  getEvidence,
  getEvidenceSkillLinks,
  updateEvidence,
} from './evidenceService'

function toInput(evidence: EvidenceRecord, links: EvidenceSkillLink[]): EvidenceInput {
  return {
    ...emptyEvidence(),
    title: evidence.title,
    evidence_type: evidence.evidence_type,
    description: evidence.description ?? '',
    source_url: evidence.source_url ?? '',
    skill_ids: links.map((link) => link.skill_id),
    relationship_note: links.find((link) => link.relationship_note)?.relationship_note ?? '',
  }
}

function processingLabel(status: EvidenceRecord['processing_status']) {
  if (status === 'pending') return 'Not analyzed'
  if (status === 'processed') return 'Processed'
  return 'Processing failed'
}

export function EvidenceDetailPage() {
  const { evidenceId = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [evidence, setEvidence] = useState<EvidenceRecord | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [links, setLinks] = useState<EvidenceSkillLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [signedUrlExpiry, setSignedUrlExpiry] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const loadData = async () => {
    if (!user || !evidenceId) return
    const record = await getEvidence(user.id, evidenceId)
    if (!record) {
      setEvidence(null)
      setSkills([])
      setLinks([])
      return
    }
    const [ownedSkills, skillLinks] = await Promise.all([
      listSkills(user.id),
      getEvidenceSkillLinks(user.id, evidenceId),
    ])
    setEvidence(record)
    setSkills(ownedSkills)
    setLinks(skillLinks)
  }

  useEffect(() => {
    if (!user || !evidenceId) return
    let active = true
    const load = async () => {
      try {
        const record = await getEvidence(user.id, evidenceId)
        if (!active) return
        if (!record) {
          setEvidence(null)
          return
        }
        const [ownedSkills, skillLinks] = await Promise.all([
          listSkills(user.id),
          getEvidenceSkillLinks(user.id, evidenceId),
        ])
        if (!active) return
        setEvidence(record)
        setSkills(ownedSkills)
        setLinks(skillLinks)
      } catch (cause) {
        if (active) setLoadError(displayDatabaseError(cause))
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [evidenceId, user])

  useEffect(() => {
    if (!signedUrlExpiry) return
    const timeout = window.setTimeout(() => {
      setSignedUrl(null)
      setSignedUrlExpiry(null)
    }, Math.max(0, signedUrlExpiry - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [signedUrlExpiry])

  const retryLoad = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      await loadData()
    } catch (cause) {
      setLoadError(displayDatabaseError(cause))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (input: EvidenceInput, file?: File) => {
    if (!user || !evidence) return
    setSaveError(null)
    setSuccess(null)
    setWarning(null)
    setIsSaving(true)
    try {
      const result = await updateEvidence(user.id, evidence.id, input, file)
      setEvidence(result.evidence)
      setLinks(await getEvidenceSkillLinks(user.id, evidence.id))
      setSuccess('Evidence changes saved privately.')
      setWarning(result.warning ?? null)
      setSignedUrl(null)
      setSignedUrlExpiry(null)
      setIsEditing(false)
    } catch (cause) {
      setSaveError(displayDatabaseError(cause))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateSignedUrl = async () => {
    if (!user || !evidence) return
    setSaveError(null)
    setSignedUrl(null)
    setSignedUrlExpiry(null)
    setIsCreatingLink(true)
    try {
      setSignedUrl(await createEvidenceSignedUrl(user.id, evidence.id))
      setSignedUrlExpiry(Date.now() + 60_000)
    } catch (cause) {
      setSaveError(displayDatabaseError(cause))
    } finally {
      setIsCreatingLink(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !evidence) return
    setSaveError(null)
    setIsSaving(true)
    try {
      const cleanupWarning = await deleteEvidence(user.id, evidence.id)
      navigate('/evidence', {
        replace: true,
        state: {
          evidenceDeleted: true,
          warning: cleanupWarning,
        },
      })
    } catch (cause) {
      setSaveError(displayDatabaseError(cause))
    } finally {
      setIsSaving(false)
      setConfirmDelete(false)
    }
  }

  if (isLoading) {
    return <PageContainer className="py-10"><LoadingState label="Loading your evidence..." /></PageContainer>
  }

  if (loadError) {
    return (
      <PageContainer className="max-w-3xl py-10">
        <ErrorState>{loadError}</ErrorState>
        <Button className="mt-4" variant="secondary" onClick={retryLoad}>Try loading evidence again</Button>
      </PageContainer>
    )
  }

  if (!evidence) {
    return (
      <PageContainer className="max-w-3xl py-10">
        <EmptyState title="Evidence not found">
          <p>This item may have been deleted, or it may not belong to your account.</p>
        </EmptyState>
        <Link to="/evidence" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy hover:text-teal-700">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to evidence
        </Link>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="max-w-4xl py-8 sm:py-12">
      <Link to="/evidence" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slatebody hover:text-teal-700">
        <ArrowLeft size={17} aria-hidden="true" />
        All evidence
      </Link>
      <PageHeading
        title={evidence.title}
        description="A record of information you submitted. Links and files are not independently verified."
        action={
          !isEditing ? (
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/evidence/analyze?evidence=${encodeURIComponent(evidence.id)}`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-navy/15 bg-white px-4 text-sm font-semibold text-navy transition-colors hover:border-teal/50 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                <Sparkles size={16} aria-hidden="true" />
                Analyze description
              </Link>
              <Button variant="secondary" onClick={() => { setIsEditing(true); setSaveError(null); setSuccess(null) }}>
                <Pencil size={16} aria-hidden="true" />
                Edit
              </Button>
              <Button
                variant="ghost"
                className="text-error hover:bg-error/5"
                onClick={() => { setConfirmDelete(true); setSaveError(null) }}
              >
                <Trash2 size={16} aria-hidden="true" />
                Delete
              </Button>
            </div>
          ) : undefined
        }
      />

      {saveError && !isEditing && <div className="mb-5"><ErrorState>{saveError}</ErrorState></div>}
      {success && <div className="mb-5"><SuccessState>{success}</SuccessState></div>}
      {warning && <div className="mb-5"><ErrorState>{warning}</ErrorState></div>}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this evidence and its private file?"
        description="Linked skills will remain; only their connections to this evidence will be removed."
        confirmLabel="Delete evidence"
        cancelLabel="Keep evidence"
        isConfirming={isSaving}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {isEditing ? (
        <EvidenceForm
          skills={skills}
          initialValue={toInput(evidence, links)}
          existingEvidence={evidence}
          isSaving={isSaving}
          error={saveError}
          onCancel={() => { setIsEditing(false); setSaveError(null) }}
          onSubmit={handleUpdate}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <Card className="p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap gap-2">
                <Badge tone="teal">{evidenceTypeLabels[evidence.evidence_type]}</Badge>
                <Badge tone={evidence.visibility === 'public' ? 'teal' : 'slate'}>
                  {evidence.visibility === 'public' ? 'Public summary' : 'Private'}
                </Badge>
                <Badge tone="slate">{processingLabel(evidence.processing_status)}</Badge>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slatebody">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slatebody">
                {evidence.description || 'No description provided.'}
              </p>
              {evidence.source_url && (
                <div className="mt-5 border-t border-navy/10 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slatebody">Submitted link</p>
                  <a
                    href={evidence.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-10 max-w-full items-center gap-2 break-all text-sm font-semibold text-teal-700 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                    aria-label="Open submitted source URL in a new tab; it has not been independently verified"
                  >
                    {evidence.source_url}
                    <ExternalLink size={16} className="shrink-0" aria-hidden="true" />
                  </a>
                  <p className="mt-2 text-xs leading-5 text-slatebody">
                    This link was supplied by you. Joby AI has not independently checked its content or authorship.
                  </p>
                </div>
              )}
              <div className="mt-5 flex items-center gap-2 border-t border-navy/10 pt-4 text-xs text-slatebody">
                <ShieldCheck size={16} className="shrink-0 text-teal" aria-hidden="true" />
                {evidence.visibility === 'public'
                  ? 'Only the selected summary is public; uploaded files remain private'
                  : 'Private to your account'}
                {' · Added '}{new Date(evidence.created_at).toLocaleDateString()}
              </div>
            </Card>

            <Card className="p-5 shadow-card sm:p-6">
              <h2 className="text-lg font-bold text-navy">Linked skills</h2>
              {links.length ? (
                <ul className="mt-4 space-y-3">
                  {links.map((link) => {
                    const skill = skills.find((item) => item.id === link.skill_id)
                    if (!skill) return null
                    return (
                      <li key={link.skill_id} className="rounded-lg border border-navy/10 p-3">
                        <Link to="/skills" className="font-semibold text-navy hover:text-teal-700">{skill.name}</Link>
                        {link.relationship_note && (
                          <p className="mt-1 text-sm leading-6 text-slatebody">{link.relationship_note}</p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slatebody">This evidence is not linked to a skill yet.</p>
              )}
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => { setIsEditing(true); setSaveError(null) }}
              >
                Link or edit skills
              </Button>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="p-5 shadow-card">
              <h2 className="font-bold text-navy">Private file</h2>
              {evidence.storage_path ? (
                <>
                  <p className="mt-2 text-sm leading-6 text-slatebody">
                    {evidence.mime_type ?? 'Uploaded file'} · Stored in a private bucket. Access links expire after 60 seconds.
                  </p>
                  <Button className="mt-4 w-full" variant="secondary" onClick={handleCreateSignedUrl} disabled={isCreatingLink}>
                    {isCreatingLink && <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />}
                    Create temporary file link
                  </Button>
                  {signedUrl && (
                    <div className="mt-3 rounded-lg bg-teal/5 p-3" role="status">
                      <a
                        href={signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-teal-700 underline hover:text-navy"
                      >
                        Open private file
                      </a>
                      <p className="mt-1 text-xs text-slatebody">This link expires in about one minute.</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slatebody">No file is attached to this evidence.</p>
              )}
            </Card>
            <Card className="p-5 shadow-card">
              <h2 className="font-bold text-navy">Evidence processing</h2>
              <p className="mt-2 text-sm leading-6 text-slatebody">
                {processingLabel(evidence.processing_status)}. AI analysis runs only when requested and uses the written description; uploaded files and URLs are not analyzed.
              </p>
            </Card>
          </aside>
        </div>
      )}
    </PageContainer>
  )
}
