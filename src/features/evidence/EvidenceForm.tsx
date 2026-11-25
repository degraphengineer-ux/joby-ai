import { LoaderCircle, UploadCloud } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/Feedback'
import { Input } from '../../components/ui/Input'
import { evidenceSchema, evidenceTypeLabels, evidenceTypes, type EvidenceInput, type EvidenceRecord } from './evidenceSchema'
import { validateEvidenceFile } from './evidenceFileValidation'
import type { Skill } from '../skills/skillSchema'

type FieldErrors = Partial<Record<keyof EvidenceInput, string>>

function getFieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const errors: FieldErrors = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string') errors[field as keyof EvidenceInput] ??= issue.message
  }
  return errors
}

export function EvidenceForm({
  skills,
  initialValue,
  existingEvidence,
  isSaving,
  error,
  onCancel,
  onSubmit,
}: {
  skills: Skill[]
  initialValue: EvidenceInput
  existingEvidence?: EvidenceRecord
  isSaving: boolean
  error: string | null
  onCancel: () => void
  onSubmit: (input: EvidenceInput, file?: File) => Promise<void>
}) {
  const [draft, setDraft] = useState(initialValue)
  const [file, setFile] = useState<File | undefined>()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [fileError, setFileError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldErrors({})
    setFileError(null)

    const result = evidenceSchema.safeParse(draft)
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error))
      return
    }

    if (result.data.evidence_type === 'document') {
      if (!file && !existingEvidence?.storage_path) {
        setFileError('Choose a PDF or PNG/JPEG project screenshot.')
        return
      }
      if (file) {
        try {
          await validateEvidenceFile(file)
        } catch (cause) {
          setFileError(cause instanceof Error ? cause.message : 'The selected file is not supported.')
          return
        }
      }
    }

    await onSubmit(result.data, file)
  }

  const handleTypeChange = (nextType: EvidenceInput['evidence_type']) => {
    setDraft((current) => ({
      ...current,
      evidence_type: nextType,
      source_url:
        nextType === 'project_url' || nextType === 'github_url'
          ? current.source_url
          : '',
    }))
    if (nextType !== 'document') {
      setFile(undefined)
      setFileError(null)
    }
  }

  const updateText = (key: 'title' | 'description' | 'source_url' | 'relationship_note', value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const toggleSkill = (skillId: string) => {
    setDraft((current) => ({
      ...current,
      skill_ids: current.skill_ids.includes(skillId)
        ? current.skill_ids.filter((id) => id !== skillId)
        : [...current.skill_ids, skillId],
    }))
  }

  const isDocument = draft.evidence_type === 'document'
  const needsUrl = draft.evidence_type === 'project_url' || draft.evidence_type === 'github_url'

  return (
    <Card className="p-5 shadow-card sm:p-7">
      <h2 className="text-xl font-bold text-navy">
        {existingEvidence ? 'Edit evidence' : 'Add evidence'}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slatebody">
        Evidence you submit is not independently verified. Your record and any uploaded file are private to your account.
      </p>
      <div className="mt-4 rounded-lg border border-navy/10 bg-warm px-4 py-3 text-sm leading-6 text-slatebody">
        <span className="font-semibold text-navy">Visibility: Private.</span> Public evidence sharing is not available yet; uploaded files stay in the private bucket. Please do not upload passports, national IDs or other sensitive identity documents.
      </div>
      {error && <div className="mt-5"><ErrorState>{error}</ErrorState></div>}

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Input
              label="Title"
              name="title"
              maxLength={120}
              required
              value={draft.title}
              onChange={(event) => updateText('title', event.target.value)}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? 'evidence-title-error' : undefined}
              placeholder="e.g. Community website redesign"
            />
            {fieldErrors.title && <p id="evidence-title-error" className="mt-1 text-sm text-error">{fieldErrors.title}</p>}
          </div>
          <div>
            <label htmlFor="evidence-type" className="block text-sm font-semibold text-navy">
              Evidence type
            </label>
            <select
              id="evidence-type"
              name="evidence_type"
              value={draft.evidence_type}
              onChange={(event) => handleTypeChange(event.target.value as EvidenceInput['evidence_type'])}
              className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
            >
              {evidenceTypes.map((type) => (
                <option key={type} value={type}>{evidenceTypeLabels[type]}</option>
              ))}
            </select>
          </div>
        </div>

        {needsUrl && (
          <div>
            <Input
              label={draft.evidence_type === 'github_url' ? 'GitHub repository URL' : 'Project URL'}
              name="source_url"
              type="url"
              maxLength={2048}
              required
              value={draft.source_url}
              onChange={(event) => updateText('source_url', event.target.value)}
              aria-invalid={Boolean(fieldErrors.source_url)}
              aria-describedby={fieldErrors.source_url ? 'evidence-url-error' : 'evidence-url-hint'}
              placeholder={draft.evidence_type === 'github_url' ? 'https://github.com/owner/repository' : 'https://example.com/project'}
            />
            {fieldErrors.source_url ? (
              <p id="evidence-url-error" className="mt-1 text-sm text-error">{fieldErrors.source_url}</p>
            ) : (
              <p id="evidence-url-hint" className="mt-1 text-sm text-slatebody">
                A submitted URL is a reference, not proof of quality or authorship.
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="evidence-description" className="block text-sm font-semibold text-navy">
            {draft.evidence_type === 'text_sample'
              ? 'Text sample or project description'
              : 'Description (optional)'}
          </label>
          <textarea
            id="evidence-description"
            name="description"
            rows={5}
            maxLength={2000}
            required={draft.evidence_type === 'text_sample'}
            value={draft.description}
            onChange={(event) => updateText('description', event.target.value)}
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? 'evidence-description-error' : undefined}
            placeholder="Describe what you contributed, the tools you used and what this work demonstrates."
            className="mt-2 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-3 text-base text-navy outline-none placeholder:text-slatebody/60 focus:border-teal focus:ring-4 focus:ring-teal/10"
          />
          {fieldErrors.description && (
            <p id="evidence-description-error" className="mt-1 text-sm text-error">{fieldErrors.description}</p>
          )}
        </div>

        {isDocument && (
          <div>
            <label htmlFor="evidence-file" className="block text-sm font-semibold text-navy">
              {existingEvidence?.storage_path ? 'Replace private file (optional)' : 'Choose a private file'}
            </label>
            <label
              htmlFor="evidence-file"
              className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-navy/20 bg-warm px-4 py-5 text-center hover:border-teal/50 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal"
            >
              <UploadCloud size={22} className="text-teal" aria-hidden="true" />
              <span className="mt-2 text-sm font-semibold text-navy">
                {file?.name ?? (existingEvidence?.storage_path ? 'Current file stored privately' : 'Select a PDF, PNG or JPEG')}
              </span>
              <span className="mt-1 text-xs text-slatebody">Maximum file size: 10 MB. Files are not analyzed in this phase.</span>
              <input
                id="evidence-file"
                name="file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                className="sr-only"
                onChange={(event) => {
                  setFile(event.target.files?.[0])
                  setFileError(null)
                }}
              />
            </label>
            {fileError && <p className="mt-2 text-sm text-error" role="alert">{fileError}</p>}
          </div>
        )}

        <fieldset className="rounded-xl border border-navy/10 p-4">
          <legend className="px-1 text-sm font-semibold text-navy">Link to your skills (optional)</legend>
          {skills.length ? (
            <>
              <div className="mt-1 grid gap-2 sm:grid-cols-2">
                {skills.map((skill) => (
                  <label key={skill.id} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-navy hover:bg-warm">
                    <input
                      type="checkbox"
                      checked={draft.skill_ids.includes(skill.id)}
                      onChange={() => toggleSkill(skill.id)}
                      className="h-4 w-4 rounded border-navy/30 text-teal focus:ring-teal"
                    />
                    <span>{skill.name}</span>
                  </label>
                ))}
              </div>
              {draft.skill_ids.length > 0 && (
                <div className="mt-4">
                  <label htmlFor="relationship-note" className="block text-sm font-semibold text-navy">
                    How does this evidence relate? (optional)
                  </label>
                  <input
                    id="relationship-note"
                    name="relationship_note"
                    maxLength={400}
                    value={draft.relationship_note}
                    onChange={(event) => updateText('relationship_note', event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
                    placeholder="Briefly explain the connection."
                    aria-invalid={Boolean(fieldErrors.relationship_note)}
                    aria-describedby={fieldErrors.relationship_note ? 'relationship-note-error' : undefined}
                  />
                  {fieldErrors.relationship_note && (
                    <p id="relationship-note-error" className="mt-1 text-sm text-error">{fieldErrors.relationship_note}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-slatebody">Add skills first, then you can connect them to this evidence.</p>
          )}
        </fieldset>

        {isSaving && (
          <div className="space-y-2" role="status" aria-live="polite">
            <p className="text-sm font-semibold text-navy">
              <LoaderCircle className="mr-2 inline animate-spin" size={16} aria-hidden="true" />
              Saving evidence securely...
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-label="Evidence upload in progress">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-teal" />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-navy/10 pt-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>Cancel</Button>
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving && <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />}
            {existingEvidence ? 'Save changes' : 'Save evidence privately'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
