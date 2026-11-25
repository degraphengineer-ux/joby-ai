import { ArrowRight, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../../components/ui/Feedback'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import { useAuth } from '../auth/useAuth'
import { listSkills } from '../skills/skillsService'
import type { Skill } from '../skills/skillSchema'
import { EvidenceForm } from './EvidenceForm'
import { emptyEvidence, evidenceTypeLabels, evidenceTypes, type EvidenceInput, type EvidenceRecord, type EvidenceType } from './evidenceSchema'
import { createEvidence, listEvidence } from './evidenceService'

export function EvidencePage() {
  const { user } = useAuth()
  const location = useLocation()
  const [items, setItems] = useState<EvidenceRecord[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | EvidenceType>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const navigationState = location.state as {
      evidenceDeleted?: boolean
      warning?: string
    } | null
    if (!navigationState?.evidenceDeleted) return
    setSuccess('Evidence and its skill links were deleted.')
    setWarning(navigationState.warning ?? null)
  }, [location.state])

  const loadData = async () => {
    if (!user) return
    const [evidence, ownedSkills] = await Promise.all([
      listEvidence(user.id),
      listSkills(user.id),
    ])
    setItems(evidence)
    setSkills(ownedSkills)
  }

  useEffect(() => {
    if (!user) return
    let active = true
    Promise.all([listEvidence(user.id), listSkills(user.id)])
      .then(([evidence, ownedSkills]) => {
        if (!active) return
        setItems(evidence)
        setSkills(ownedSkills)
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

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      const matchesType = typeFilter === 'all' || item.evidence_type === typeFilter
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        (item.description ?? '').toLowerCase().includes(query) ||
        (item.source_url ?? '').toLowerCase().includes(query)
      return matchesType && matchesSearch
    })
  }, [items, search, typeFilter])

  const handleCreate = async (input: EvidenceInput, file?: File) => {
    if (!user) return
    setSaveError(null)
    setSuccess(null)
    setWarning(null)
    setIsSaving(true)
    try {
      const result = await createEvidence(user.id, input, file)
      setSuccess('Evidence saved privately. It is not independently verified or analyzed.')
      setWarning(result.warning ?? null)
      setShowForm(false)
      try {
        await loadData()
      } catch (cause) {
        setLoadError(displayDatabaseError(cause))
      }
    } catch (cause) {
      setSaveError(displayDatabaseError(cause))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer className="py-8 sm:py-12">
      <PageHeading
        title="Your evidence"
        description="Save project links, work descriptions and private files. A submission documents what you provided; it does not independently verify quality or authorship."
        action={
          <Button
            size="lg"
            disabled={isLoading || Boolean(loadError)}
            onClick={() => { setShowForm(true); setSaveError(null); setSuccess(null); setWarning(null) }}
          >
            <Plus size={18} aria-hidden="true" />
            Add evidence
          </Button>
        }
      />

      <div className="mb-6 rounded-xl border border-teal/20 bg-teal/5 p-4 text-sm leading-6 text-navy">
        <strong>Privacy:</strong> Evidence records and uploaded files are private to your account. Files are never made public here; temporary access links expire after 60 seconds. Do not upload passports, national IDs or other sensitive identity documents. AI skill suggestions must be reviewed before they are saved.
      </div>

      {saveError && !showForm && <div className="mb-5"><ErrorState>{saveError}</ErrorState></div>}
      {success && <div className="mb-5"><SuccessState>{success}</SuccessState></div>}
      {warning && <div className="mb-5"><ErrorState>{warning}</ErrorState></div>}

      {showForm && !isLoading && !loadError && (
        <div className="mb-7">
          <EvidenceForm
            skills={skills}
            initialValue={emptyEvidence()}
            isSaving={isSaving}
            error={saveError}
            onCancel={() => { setShowForm(false); setSaveError(null) }}
            onSubmit={handleCreate}
          />
        </div>
      )}

      <section aria-label="Evidence list">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="evidence-search" className="sr-only">Search evidence</label>
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slatebody" aria-hidden="true" />
            <input
              id="evidence-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search titles, descriptions or URLs"
              className="min-h-11 w-full rounded-lg border border-navy/15 bg-white pl-10 pr-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
            />
          </div>
          <div>
            <label htmlFor="evidence-filter" className="sr-only">Filter by evidence type</label>
            <select
              id="evidence-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'all' | EvidenceType)}
              className="min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10 sm:w-64"
            >
              <option value="all">All evidence types</option>
              {evidenceTypes.map((type) => <option key={type} value={type}>{evidenceTypeLabels[type]}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading your private evidence..." />
        ) : loadError ? (
          <div className="space-y-4">
            <ErrorState>{loadError}</ErrorState>
            <Button variant="secondary" onClick={retryLoad}>Try loading evidence again</Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No evidence added yet">
            <p>Add a project link, a work description or a private file when you are ready.</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus size={18} aria-hidden="true" />
              Add your first evidence item
            </Button>
          </EmptyState>
        ) : visibleItems.length === 0 ? (
          <EmptyState title="No matching evidence">
            <p>Try a different search or evidence type filter.</p>
          </EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {visibleItems.map((item) => (
              <li key={item.id}>
                <Card as="article" className="flex h-full flex-col p-5 shadow-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="teal">{evidenceTypeLabels[item.evidence_type]}</Badge>
                    <Badge tone={item.visibility === 'public' ? 'teal' : 'slate'}>
                      {item.visibility === 'public' ? 'Public summary' : 'Private'}
                    </Badge>
                  </div>
                  <h2 className="mt-4 break-words text-lg font-bold text-navy">{item.title}</h2>
                  {item.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slatebody">{item.description}</p>
                  )}
                  {item.source_url && <p className="mt-2 break-all text-xs text-slatebody">{item.source_url}</p>}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 pt-4 mt-5">
                    <span className="text-xs text-slatebody">
                      Submitted {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/evidence/${item.id}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-navy hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                    >
                      View details
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  )
}
