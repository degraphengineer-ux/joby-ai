import { LoaderCircle, Save } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState, LoadingState, SuccessState } from '../../components/ui/Feedback'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import { useAuth } from '../auth/useAuth'
import { ProfileFields } from './ProfileFields'
import { emptyProfile, profileSchema, type ProfileInput } from './profileSchema'
import { getProfile, saveProfile } from './profileService'

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

export function ProfilePage() {
  const { user } = useAuth()
  const [draft, setDraft] = useState<ProfileInput>(emptyProfile())
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileInput, string>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const reloadProfile = async () => {
    if (!user) return
    setIsLoading(true)
    setLoadError(null)
    try {
      const profile = await getProfile(user.id)
      if (profile) {
        setDraft({
          display_name: profile.display_name ?? '',
          headline: profile.headline ?? '',
          bio: profile.bio ?? '',
          location: profile.location ?? '',
          target_role: profile.target_role ?? '',
          years_experience: profile.years_experience ?? null,
        })
      }
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
        if (!active || !profile) return
        setDraft({
          display_name: profile.display_name ?? '',
          headline: profile.headline ?? '',
          bio: profile.bio ?? '',
          location: profile.location ?? '',
          target_role: profile.target_role ?? '',
          years_experience: profile.years_experience ?? null,
        })
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
      setDraft({
        display_name: profile.display_name,
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        location: profile.location ?? '',
        target_role: profile.target_role ?? '',
        years_experience: profile.years_experience ?? null,
      })
      setSuccess('Your profile changes have been saved.')
    } catch (cause) {
      setSaveError(displayDatabaseError(cause))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer className="max-w-4xl py-8 sm:py-12">
      <PageHeading
        title="Your profile"
        description="Describe your experience and the work you are interested in. Your details remain private unless you choose otherwise."
      />
      {isLoading ? (
        <LoadingState label="Loading your profile..." />
      ) : loadError ? (
        <div className="space-y-4">
          <ErrorState>{loadError}</ErrorState>
          <Button variant="secondary" onClick={reloadProfile}>Try loading your profile again</Button>
        </div>
      ) : (
        <>
          <Card className="p-5 shadow-card sm:p-8">
            <form onSubmit={handleSubmit} noValidate>
              {saveError && <div className="mb-5"><ErrorState>{saveError}</ErrorState></div>}
              {success && <div className="mb-5"><SuccessState>{success}</SuccessState></div>}
              <ProfileFields value={draft} onChange={setDraft} errors={errors} />
              <div className="mt-7 flex justify-end border-t border-navy/10 pt-5">
                <Button type="submit" size="lg" disabled={isSaving}>
                  {isSaving ? <LoaderCircle className="animate-spin" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        </>
      )}
    </PageContainer>
  )
}
