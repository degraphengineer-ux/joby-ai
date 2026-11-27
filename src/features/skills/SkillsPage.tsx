import { useEffect, useState, type FormEvent } from 'react'
import { LoaderCircle, Pencil, Plus, Trash2, X } from '../../components/ui/icons'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../../components/ui/Feedback'
import { Input } from '../../components/ui/Input'
import { SelectField } from '../../components/ui/SelectField'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import { useAuth } from '../auth/useAuth'
import { initialProfileName } from '../profile/profileService'
import { emptySkill, proficiencyLabels, proficiencyLevels, skillSchema, type Skill, type SkillInput } from './skillSchema'
import { createSkill, deleteSkill, listSkills, updateSkill } from './skillsService'

function getValidationMessage(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const messages: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string') messages[field] ??= issue.message
  }
  return messages
}

export function SkillsPage() {
  const { user } = useAuth()
  const [skills, setSkills] = useState<Skill[]>([])
  const [draft, setDraft] = useState<SkillInput>(emptySkill())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const refreshSkills = async () => {
    if (!user) return
    const result = await listSkills(user.id)
    setSkills(result)
    setLoadError(null)
  }

  useEffect(() => {
    if (!user) return
    let active = true
    listSkills(user.id)
      .then((result) => {
        if (active) setSkills(result)
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
    if (!user) return
    setIsLoading(true)
    setLoadError(null)
    try {
      await refreshSkills()
    } catch (cause) {
      setLoadError(displayDatabaseError(cause))
    } finally {
      setIsLoading(false)
    }
  }

  const startNew = () => {
    setDraft(emptySkill())
    setEditingId(null)
    setFieldErrors({})
    setError(null)
    setSuccess(null)
    setShowForm(true)
  }

  const startEdit = (skill: Skill) => {
    setDraft({
      name: skill.name,
      category: skill.category ?? '',
      self_reported_level: skill.self_reported_level,
      description: skill.description ?? '',
    })
    setEditingId(skill.id)
    setFieldErrors({})
    setError(null)
    setSuccess(null)
    setShowForm(true)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const result = skillSchema.safeParse(draft)
    if (!result.success) {
      setFieldErrors(getValidationMessage(result.error))
      return
    }
    if (!user) return

    setFieldErrors({})
    setIsSaving(true)
    try {
      if (editingId) {
        await updateSkill(user.id, editingId, result.data)
        setSuccess('Skill updated.')
      } else {
        await createSkill(user.id, result.data, initialProfileName(user))
        setSuccess('Skill added to your profile.')
      }
      await refreshSkills()
      setShowForm(false)
      setEditingId(null)
      setDraft(emptySkill())
    } catch (cause) {
      setError(displayDatabaseError(cause))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (skillId: string) => {
    if (!user) return
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    try {
      await deleteSkill(user.id, skillId)
      setSkills((current) => current.filter((skill) => skill.id !== skillId))
      setDeletingId(null)
      setSuccess('Skill removed.')
    } catch (cause) {
      setError(displayDatabaseError(cause))
    } finally {
      setIsSaving(false)
    }
  }

  const skillToDelete = skills.find((skill) => skill.id === deletingId)

  return (
    <PageContainer className="py-8 sm:py-12">
      <PageHeading
        title="Your skills"
        description="Keep a clear record of what you can do. Self-reported proficiency is separate from any assessment outcome."
        action={
          <Button size="lg" onClick={startNew}>
            <Plus size={18} aria-hidden="true" />
            Add a skill
          </Button>
        }
      />
      <p className="mb-6 text-sm text-slatebody">
        Proficiency levels here are self-reported and are not a verification or assessment result.
      </p>
      {error && <div className="mb-5"><ErrorState>{error}</ErrorState></div>}
      {success && <div className="mb-5"><SuccessState>{success}</SuccessState></div>}

      {showForm && (
        <Card className="mb-6 p-5 shadow-card sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-navy">{editingId ? 'Edit skill' : 'Add a skill'}</h2>
              <p className="mt-1 text-sm text-slatebody">Fields marked optional can be left blank.</p>
            </div>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="grid h-10 w-10 place-items-center rounded-lg text-slatebody hover:bg-navy/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
              aria-label="Close skill form"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={handleSave} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Input
                  label="Skill name"
                  name="name"
                  autoFocus
                  maxLength={80}
                  required
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'skill-name-error' : undefined}
                />
                {fieldErrors.name && <p id="skill-name-error" className="mt-1 text-sm text-error">{fieldErrors.name}</p>}
              </div>
              <div>
                <Input
                  label="Category (optional)"
                  name="category"
                  maxLength={60}
                  placeholder="e.g. Web development"
                  value={draft.category}
                  onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                  aria-invalid={Boolean(fieldErrors.category)}
                  aria-describedby={fieldErrors.category ? 'skill-category-error' : undefined}
                />
                {fieldErrors.category && <p id="skill-category-error" className="mt-1 text-sm text-error">{fieldErrors.category}</p>}
              </div>
              <div>
                <SelectField
                  label="Self-reported proficiency"
                  id="self_reported_level"
                  name="self_reported_level"
                  value={draft.self_reported_level}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    self_reported_level: event.target.value as SkillInput['self_reported_level'],
                  }))}
                >
                  {proficiencyLevels.map((level) => (
                    <option key={level} value={level}>{proficiencyLabels[level]}</option>
                  ))}
                </SelectField>
                <p className="mt-1 text-xs text-slatebody">This is your self-assessment, not a verified result.</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="skill-description" className="block text-sm font-semibold text-navy">
                  Description (optional)
                </label>
                <textarea
                  id="skill-description"
                  name="description"
                  rows={3}
                  maxLength={400}
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Add context about how you have used this skill."
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={fieldErrors.description ? 'skill-description-error' : undefined}
                  className="mt-2 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-3 text-base text-navy outline-none placeholder:text-slatebody/60 focus:border-teal focus:ring-4 focus:ring-teal/10"
                />
                {fieldErrors.description && <p id="skill-description-error" className="mt-1 text-sm text-error">{fieldErrors.description}</p>}
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-navy/10 pt-5 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => { setShowForm(false); setError(null) }}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />}
                {editingId ? 'Save skill' : 'Add skill'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <LoadingState label="Loading your skills..." />
      ) : loadError ? (
        <div className="space-y-4">
          <ErrorState>{loadError}</ErrorState>
          <Button variant="secondary" onClick={retryLoad}>Try loading skills again</Button>
        </div>
      ) : skills.length === 0 ? (
        <EmptyState title="No skills added yet">
          <p>Add a skill to start building your evidence-first profile.</p>
          <Button className="mt-4" onClick={startNew}>
            <Plus size={18} aria-hidden="true" />
            Add your first skill
          </Button>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {skills.map((skill) => (
            <li key={skill.id}>
              <Card as="article" className="h-full p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-bold text-navy">{skill.name}</h2>
                    {skill.category && <p className="mt-1 text-sm text-slatebody">{skill.category}</p>}
                  </div>
                  <Badge tone="teal">{proficiencyLabels[skill.self_reported_level]}</Badge>
                </div>
                {skill.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slatebody">{skill.description}</p>}
                <p className="mt-4 text-xs text-slatebody">
                  Self-reported · Updated {new Date(skill.updated_at).toLocaleDateString()}
                </p>
                <div className="mt-5 flex gap-2 border-t border-navy/10 pt-4">
                  <Button variant="secondary" onClick={() => startEdit(skill)} disabled={isSaving}>
                    <Pencil size={16} aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-error hover:bg-error/5"
                    onClick={() => { setDeletingId(skill.id); setError(null) }}
                    aria-label={`Remove ${skill.name}`}
                    disabled={isSaving}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(skillToDelete)}
        title={`Remove ${skillToDelete?.name ?? 'this skill'} from your profile?`}
        description="This removes the skill record from your account. This action cannot be undone."
        confirmLabel="Remove skill"
        cancelLabel="Keep skill"
        isConfirming={isSaving}
        onConfirm={() => { if (skillToDelete) void handleDelete(skillToDelete.id) }}
        onCancel={() => setDeletingId(null)}
      />
    </PageContainer>
  )
}
