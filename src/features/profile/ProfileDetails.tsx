import { useEffect, useState, type FormEvent } from 'react'
import { Check, LoaderCircle, Pencil, Save, X } from '../../components/ui/icons'
import { Button } from '../../components/ui/Button'
import { ErrorState, LoadingState, Toast } from '../../components/ui/Feedback'
import { ProfileFields } from './ProfileFields'
import { emptyProfile, profileSchema, type ProfileInput } from './profileSchema'
import { getProfile, saveProfile } from './profileService'
import { displayDatabaseError } from '../../lib/displayErrors'
import { useAuth } from '../auth/useAuth'

function validationErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const errors: Partial<Record<keyof ProfileInput, string>> = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && field in emptyProfile()) {
      errors[field as keyof ProfileInput] ??= issue.message
    }
  }
  return errors
}

function toProfileInput(profile: Awaited<ReturnType<typeof getProfile>>): ProfileInput {
  return {
    display_name: profile?.display_name ?? '',
    headline: profile?.headline ?? '',
    bio: profile?.bio ?? '',
    location: profile?.location ?? '',
    target_role: profile?.target_role ?? '',
    years_experience: profile?.years_experience ?? null,
  }
}

const profileFields: { key: keyof Omit<ProfileInput, 'years_experience'>; label: string }[] = [
  { key: 'display_name', label: 'Display name' },
  { key: 'headline', label: 'Professional headline' },
  { key: 'bio', label: 'Short bio' },
  { key: 'location', label: 'Location' },
  { key: 'target_role', label: 'Target role' },
]

export function ProfileDetails() {
  const { user } = useAuth()
  const [savedProfile, setSavedProfile] = useState<ProfileInput>(emptyProfile())
  const [draft, setDraft] = useState<ProfileInput>(emptyProfile())
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileInput, string>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasSavedProfile, setHasSavedProfile] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadProfile = async () => {
    if (!user) return
    setIsLoading(true)
    setLoadError(null)
    try {
      const profile = await getProfile(user.id)
      const values = toProfileInput(profile)
      setSavedProfile(values)
      setDraft(values)
      setHasSavedProfile(profile !== null)
    } catch (cause) {
      setLoadError(displayDatabaseError(cause))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    let active = true
    getProfile(user.id)
      .then((profile) => {
        if (!active) return
        const values = toProfileInput(profile)
        setSavedProfile(values)
        setDraft(values)
        setHasSavedProfile(profile !== null)
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError(null)
    setSuccess(null)
    const result = profileSchema.safeParse(draft)
    if (!result.success) {
      setErrors(validationErrors(result.error))
      return
    }
    setErrors({})
    if (!user) return
    setIsSaving(true)
    try {
      const profile = await saveProfile(user.id, result.data)
      const values = toProfileInput(profile)
      setSavedProfile(values)
      setDraft(values)
      setHasSavedProfile(true)
      setIsEditing(false)
      setSuccess('Your profile changes have been saved.')
    } catch (cause) {
      setSaveError(displayDatabaseError(cause))
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    setDraft(savedProfile)
    setErrors({})
    setSaveError(null)
    setSuccess(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setDraft(savedProfile)
    setErrors({})
    setSaveError(null)
    setIsEditing(false)
  }

  if (isLoading) return <LoadingState label="Loading your profile..." />
  if (loadError) {
    return (
      <div className="space-y-4">
        <ErrorState>{loadError}</ErrorState>
        <Button variant="secondary" onClick={loadProfile}>Try loading your profile again</Button>
      </div>
    )
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} noValidate>
        {saveError && <div className="mb-5"><ErrorState>{saveError}</ErrorState></div>}
        <ProfileFields value={draft} onChange={setDraft} errors={errors} />
        <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-navy/10 pt-5">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSaving}>
            <X size={17} aria-hidden="true" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving
              ? <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
              : <Save size={18} aria-hidden="true" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div>
      {success && <div className="mb-5"><Toast>{success}</Toast></div>}
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {profileFields.map(({ key, label }) => (
          <div key={key} className={key === 'bio' ? 'sm:col-span-2' : undefined}>
            <dt className="text-sm font-semibold text-slatebody">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-base leading-7 text-navy">
              {savedProfile[key] || <span className="text-slatebody/70">Not provided</span>}
            </dd>
          </div>
        ))}
        <div>
          <dt className="text-sm font-semibold text-slatebody">Years of experience</dt>
          <dd className="mt-1 text-base leading-7 text-navy">
            {savedProfile.years_experience === null
              ? <span className="text-slatebody/70">Not provided</span>
              : `${savedProfile.years_experience} ${savedProfile.years_experience === 1 ? 'year' : 'years'}`}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 pt-4">
        {hasSavedProfile ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-slatebody" role="status">
            <Check size={16} className="text-teal" aria-hidden="true" />
            Saved profile
          </p>
        ) : <span aria-hidden="true" />}
        <Button variant="secondary" onClick={handleEdit}>
          <Pencil size={16} aria-hidden="true" />
          Edit Profile
        </Button>
      </div>
    </div>
  )
}
