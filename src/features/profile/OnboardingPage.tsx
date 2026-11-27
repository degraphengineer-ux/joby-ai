import { Check, ChevronLeft, ChevronRight, LoaderCircle, Plus, X } from '../../components/ui/icons'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ZodError } from 'zod'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState, SuccessState } from '../../components/ui/Feedback'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import { useAuth } from '../auth/useAuth'
import { listSkills, createSkill } from '../skills/skillsService'
import { profileSchema, emptyProfile, type ProfileInput } from './profileSchema'
import { getProfile, saveProfile } from './profileService'
import { ProfileFields } from './ProfileFields'

const steps = [
  { title: 'The basics', description: 'Choose how you would like to appear in your skills profile.' },
  { title: 'Your direction', description: 'Add context about the work you want to do. These details are optional.' },
  { title: 'Areas of interest', description: 'Add a few skills to get your profile started, or skip this step.' },
]

function profileFieldErrors(error: ZodError<ProfileInput>) {
  const errors: Partial<Record<keyof ProfileInput, string>> = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && field in emptyProfile()) {
      errors[field as keyof ProfileInput] ??= issue.message
    }
  }
  return errors
}

export function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<ProfileInput>(
    emptyProfile(user?.user_metadata?.display_name ?? ''),
  )
  const [step, setStep] = useState(0)
  const [interests, setInterests] = useState<string[]>([])
  const [interestInput, setInterestInput] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileInput, string>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    Promise.all([getProfile(user.id), listSkills(user.id)])
      .then(([profile, skills]) => {
        if (!active) return
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
        setInterests(skills.map((skill) => skill.name))
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
      const [profile, skills] = await Promise.all([getProfile(user.id), listSkills(user.id)])
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
      setInterests(skills.map((skill) => skill.name))
    } catch (cause) {
      setLoadError(displayDatabaseError(cause))
    } finally {
      setIsLoading(false)
    }
  }

  const saveDraft = async () => {
    if (!user) return
    const result = profileSchema.safeParse(draft)
    if (!result.success) {
      setFieldErrors(profileFieldErrors(result.error))
      return false
    }
    setFieldErrors({})
    await saveProfile(user.id, result.data)
    return true
  }

  const handleContinue = async () => {
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    try {
      if (await saveDraft()) {
        setStep((current) => Math.min(current + 1, steps.length - 1))
        setSuccess('Your progress has been saved.')
      }
    } catch (cause) {
      setError(displayDatabaseError(cause))
    } finally {
      setIsSaving(false)
    }
  }

  const addInterest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = interestInput.trim()
    if (!name) return
    if (name.length > 80) {
      setError('Skill names must be 80 characters or fewer.')
      return
    }
    if (interests.some((interest) => interest.toLowerCase() === name.toLowerCase())) {
      setError('That skill is already in your list.')
      return
    }
    setError(null)
    setInterests((current) => [...current, name])
    setInterestInput('')
  }

  const finishOnboarding = async () => {
    if (!user) return
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    try {
      if (!(await saveDraft())) return

      const currentSkills = await listSkills(user.id)
      const existing = new Set(currentSkills.map((skill) => skill.name.trim().toLowerCase()))
      for (const name of interests) {
        if (existing.has(name.trim().toLowerCase())) continue
        await createSkill(user.id, {
          name,
          category: '',
          self_reported_level: 'unsure',
          description: '',
        }, draft.display_name)
        existing.add(name.trim().toLowerCase())
      }
      setSuccess('Your profile is ready.')
      navigate('/dashboard', { replace: true })
    } catch (cause) {
      setError(displayDatabaseError(cause))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <PageContainer className="py-10">
        <div className="rounded-xl border border-navy/10 bg-white p-6 text-sm text-slatebody" role="status">
          Loading your saved progress...
        </div>
      </PageContainer>
    )
  }

  if (loadError) {
    return (
      <PageContainer className="max-w-4xl py-8 sm:py-12">
        <PageHeading title="Set up your profile" description="Your saved progress could not be loaded." />
        <ErrorState>{loadError}</ErrorState>
        <Button className="mt-4" variant="secondary" onClick={retryLoad}>Try loading progress again</Button>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="max-w-4xl py-8 sm:py-12">
      <PageHeading
        title="Set up your profile"
        description="A few details help make your practical skills easier to understand. You can update everything later."
      />

      <div className="mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-navy">Step {step + 1} of {steps.length}</span>
          <span className="text-slatebody">{steps[step].title}</span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-navy/10"
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full rounded-full bg-teal transition-[width]"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <Card className="p-5 shadow-card sm:p-8">
        <h2 className="text-xl font-bold text-navy">{steps[step].title}</h2>
        <p className="mt-2 text-sm leading-6 text-slatebody">{steps[step].description}</p>

        {error && <div className="mt-5"><ErrorState>{error}</ErrorState></div>}
        {success && <div className="mt-5"><SuccessState>{success}</SuccessState></div>}

        {step < 2 ? (
          <div className="mt-6">
            {step === 0 ? (
              <div className="max-w-xl space-y-5">
                <div>
                  <label htmlFor="display_name" className="block text-sm font-semibold text-navy">
                    Display name
                  </label>
                  <input
                    id="display_name"
                    name="display_name"
                    autoComplete="name"
                    maxLength={80}
                    required
                    value={draft.display_name}
                    onChange={(event) => setDraft((current) => ({ ...current, display_name: event.target.value }))}
                    aria-invalid={Boolean(fieldErrors.display_name)}
                    aria-describedby={fieldErrors.display_name ? 'onboarding-name-error' : undefined}
                    className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
                  />
                  {fieldErrors.display_name && (
                    <p id="onboarding-name-error" className="mt-1 text-sm text-error">{fieldErrors.display_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="headline" className="block text-sm font-semibold text-navy">
                    Professional headline <span className="font-normal text-slatebody">(optional)</span>
                  </label>
                  <input
                    id="headline"
                    name="headline"
                    maxLength={120}
                    placeholder="e.g. Frontend developer"
                    value={draft.headline}
                    onChange={(event) => setDraft((current) => ({ ...current, headline: event.target.value }))}
                    className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
                  />
                </div>
              </div>
            ) : (
              <ProfileFields value={draft} onChange={setDraft} errors={fieldErrors} />
            )}
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-slatebody">
              Your skill level starts as “Not sure.” You can choose a self-reported level from the Skills page.
            </p>
            <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={addInterest}>
              <label htmlFor="interest" className="sr-only">Add a skill or area of interest</label>
              <input
                id="interest"
                value={interestInput}
                maxLength={80}
                onChange={(event) => setInterestInput(event.target.value)}
                placeholder="e.g. HTML and CSS"
                className="min-h-11 flex-1 rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
              />
              <Button type="submit" variant="secondary">
                <Plus size={18} aria-hidden="true" />
                Add skill
              </Button>
            </form>
            {interests.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Skills to add to your profile">
                {interests.map((interest) => (
                  <li
                    key={interest}
                    className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-3 py-1.5 text-sm font-semibold text-navy"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => setInterests((current) => current.filter((value) => value !== interest))}
                      className="rounded-full p-0.5 text-slatebody hover:bg-navy/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
                      aria-label={`Remove ${interest}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slatebody">No skills added yet. This step is optional.</p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-navy/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {step > 0 ? (
              <Button variant="ghost" onClick={() => { setError(null); setSuccess(null); setStep((current) => current - 1) }}>
                <ChevronLeft size={18} aria-hidden="true" />
                Back
              </Button>
            ) : (
              <Link to="/dashboard" className="text-sm font-semibold text-slatebody hover:text-navy">
                Finish later
              </Link>
            )}
          </div>
          {step < 2 ? (
            <Button size="lg" onClick={handleContinue} disabled={isSaving}>
              {isSaving ? <LoaderCircle className="animate-spin" size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
              Continue
            </Button>
          ) : (
            <Button size="lg" onClick={finishOnboarding} disabled={isSaving}>
              {isSaving ? <LoaderCircle className="animate-spin" size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
              Finish setup
            </Button>
          )}
        </div>
      </Card>
    </PageContainer>
  )
}
