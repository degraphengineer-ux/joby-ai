import { z } from 'zod'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, LoaderCircle, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState, LoadingState, Toast } from '../../components/ui/Feedback'
import { Input } from '../../components/ui/Input'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { VisibilityToggle } from '../../components/ui/VisibilityToggle'
import { displayDatabaseError } from '../../lib/displayErrors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/useAuth'
import { ProfileDetails } from '../profile/ProfileDetails'
import { getProfile } from '../profile/profileService'
import { setPassportSharing } from '../passport/passportService'

const passwordSchema = z.object({
  password: z.string().min(8, 'Use at least 8 characters.'),
  confirmation: z.string(),
}).refine((value) => value.password === value.confirmation, {
  path: ['confirmation'],
  message: 'The passwords do not match.',
})

type PasswordDraft = z.infer<typeof passwordSchema>
const emptyPassword = (): PasswordDraft => ({ password: '', confirmation: '' })

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [passwordDraft, setPasswordDraft] = useState<PasswordDraft>(emptyPassword())
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordDraft, string>>>({})
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isPublic, setIsPublic] = useState<boolean | null>(null)
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(true)
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)
  const [privacyError, setPrivacyError] = useState<string | null>(null)
  const [privacySuccess, setPrivacySuccess] = useState<string | null>(null)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const loadPrivacy = async () => {
    if (!user) return
    const profile = await getProfile(user.id)
    if (!profile) throw new Error('Your profile could not be found. Complete your profile before changing sharing settings.')
    setIsPublic(profile.is_public)
  }

  useEffect(() => {
    if (!user) return
    let active = true
    getProfile(user.id)
      .then((profile) => {
        if (!active) return
        if (!profile) {
          setPrivacyError('Your profile could not be found. Complete your profile before changing sharing settings.')
          return
        }
        setIsPublic(profile.is_public)
      })
      .catch((cause: unknown) => {
        if (active) setPrivacyError(displayDatabaseError(cause))
      })
      .finally(() => {
        if (active) setIsLoadingPrivacy(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const retryPrivacy = async () => {
    setIsLoadingPrivacy(true)
    setPrivacyError(null)
    try {
      await loadPrivacy()
    } catch (cause) {
      setPrivacyError(displayDatabaseError(cause))
    } finally {
      setIsLoadingPrivacy(false)
    }
  }

  const handlePrivacyChange = async (nextValue: boolean) => {
    if (!user || isPublic === null) return
    setIsSavingPrivacy(true)
    setPrivacyError(null)
    setPrivacySuccess(null)
    try {
      const sharing = await setPassportSharing(user.id, nextValue)
      setIsPublic(sharing.is_public)
      setPrivacySuccess(sharing.is_public
        ? 'Public sharing is on. Choose which evidence summaries to include from your Skills Passport.'
        : 'Public sharing is off. Your public passport link has been revoked.')
    } catch (cause) {
      setPrivacyError(displayDatabaseError(cause))
    } finally {
      setIsSavingPrivacy(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    setPasswordErrors({})
    const result = passwordSchema.safeParse(passwordDraft)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (key === 'password' || key === 'confirmation') {
          setPasswordErrors((current) => ({ ...current, [key]: current[key] ?? issue.message }))
        }
      }
      return
    }
    if (!supabase) {
      setPasswordError('Account settings are unavailable because Supabase is not configured.')
      return
    }
    setIsSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: result.data.password })
      if (error) throw error
      setPasswordDraft(emptyPassword())
      setPasswordSuccess('Your password has been updated.')
      setIsEditingPassword(false)
    } catch (cause) {
      setPasswordError(displayDatabaseError(cause))
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleSignOut = async () => {
    setSignOutError(null)
    setIsSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (cause) {
      setSignOutError(displayDatabaseError(cause))
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <PageContainer className="max-w-4xl py-8 sm:py-12">
      <PageHeading
        title="Settings"
        description="Manage your account, password and Skills Passport privacy."
      />

      <div className="space-y-6">
        <Card as="section" aria-labelledby="profile-settings-heading" className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
              <UserRound size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="profile-settings-heading" className="text-lg font-bold text-navy">Profile details</h2>
              <p className="mt-1 text-sm leading-6 text-slatebody">
                Your email is used to sign in. Profile details below remain private unless you choose to share them.
              </p>
              <p className="mt-4 break-all text-sm font-medium text-navy">{user?.email ?? 'No email address available'}</p>
              <div className="mt-6 border-t border-navy/10 pt-5">
                <ProfileDetails />
              </div>
            </div>
          </div>
        </Card>

        <Card as="section" aria-labelledby="password-settings-heading" className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
              <KeyRound size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="password-settings-heading" className="text-lg font-bold text-navy">Password and account</h2>
              <p className="mt-1 text-sm leading-6 text-slatebody">
                Choose a new password for your account. Use at least 8 characters.
              </p>
              {passwordError && <div className="mt-4"><ErrorState>{passwordError}</ErrorState></div>}
              {passwordSuccess && <div className="mt-4"><Toast>{passwordSuccess}</Toast></div>}
              {isEditingPassword ? (
                <form className="mt-5 max-w-xl space-y-4" onSubmit={handlePasswordSubmit} noValidate>
                  <div>
                    <Input
                      label="New password"
                      name="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordDraft.password}
                      onChange={(event) => setPasswordDraft((current) => ({ ...current, password: event.target.value }))}
                      aria-invalid={Boolean(passwordErrors.password)}
                      aria-describedby={passwordErrors.password ? 'settings-password-error' : undefined}
                    />
                    {passwordErrors.password && <p id="settings-password-error" className="mt-1 text-sm text-error">{passwordErrors.password}</p>}
                  </div>
                  <div>
                    <Input
                      label="Confirm new password"
                      name="confirm-new-password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordDraft.confirmation}
                      onChange={(event) => setPasswordDraft((current) => ({ ...current, confirmation: event.target.value }))}
                      aria-invalid={Boolean(passwordErrors.confirmation)}
                      aria-describedby={passwordErrors.confirmation ? 'settings-confirmation-error' : undefined}
                    />
                    {passwordErrors.confirmation && <p id="settings-confirmation-error" className="mt-1 text-sm text-error">{passwordErrors.confirmation}</p>}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isSavingPassword}
                      onClick={() => {
                        setPasswordDraft(emptyPassword())
                        setPasswordErrors({})
                        setPasswordError(null)
                        setPasswordSuccess(null)
                        setIsEditingPassword(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSavingPassword}>
                      {isSavingPassword && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
                      Update password
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  className="mt-5"
                  variant="secondary"
                  onClick={() => {
                    setPasswordError(null)
                    setPasswordSuccess(null)
                    setIsEditingPassword(true)
                  }}
                >
                  <KeyRound size={17} aria-hidden="true" />
                  Change password
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card as="section" aria-labelledby="privacy-settings-heading" className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
              <ShieldCheck size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="privacy-settings-heading" className="text-lg font-bold text-navy">Privacy and sharing</h2>
              <p className="mt-1 text-sm leading-6 text-slatebody">
                Public sharing is optional and can be revoked at any time. Uploaded evidence files always remain private.
              </p>
              {isLoadingPrivacy ? (
                <div className="mt-4"><LoadingState label="Loading your sharing settings..." /></div>
              ) : privacyError ? (
                <div className="mt-4 space-y-3">
                  <ErrorState>{privacyError}</ErrorState>
                  <Button variant="secondary" onClick={retryPrivacy}>Reload sharing settings</Button>
                </div>
              ) : isPublic !== null ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-navy/10 p-4">
                  <div>
                    <p className="font-semibold text-navy">{isPublic ? 'Your passport is public' : 'Your passport is private'}</p>
                    <p className="mt-1 text-sm leading-6 text-slatebody">
                      {isPublic
                        ? 'Anyone with the link can see approved profile details and public evidence summaries.'
                        : 'Only you can see your private passport preview.'}
                    </p>
                  </div>
                  <VisibilityToggle
                    checked={isPublic}
                    busy={isSavingPrivacy}
                    label="Public Skills Passport sharing"
                    onChange={handlePrivacyChange}
                  />
                </div>
              ) : null}
              {privacySuccess && <div className="mt-4"><Toast>{privacySuccess}</Toast></div>}
              {isPublic && !privacyError && (
                <Link to="/passport" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-700 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal">
                  <Eye size={16} aria-hidden="true" />
                  Choose what appears on your passport
                </Link>
              )}
              {isPublic === false && !privacyError && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-slatebody">
                  <EyeOff size={16} aria-hidden="true" />
                  Public access is currently off.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card as="section" aria-labelledby="deletion-heading" className="p-5 sm:p-7">
          <h2 id="deletion-heading" className="text-lg font-bold text-navy">Account deletion</h2>
          <p className="mt-2 text-sm leading-6 text-slatebody">
            Account deletion is handled manually; there is no in-app deletion request yet. Contact the team operating this Joby AI instance through its established support channel and request deletion of your account and associated profile, skills, evidence files and assessment records. Include only your sign-in email—never send your password or identity documents. The operator must process the request through the configured Supabase project and applicable data-retention requirements.
          </p>
        </Card>

        <Card as="section" aria-labelledby="signout-heading" className="p-5 sm:p-7">
          <h2 id="signout-heading" className="text-lg font-bold text-navy">Sign out</h2>
          <p className="mt-2 text-sm leading-6 text-slatebody">End this session on this device.</p>
          {signOutError && <div className="mt-4"><ErrorState>{signOutError}</ErrorState></div>}
          <Button className="mt-4" variant="secondary" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <LogOut size={17} aria-hidden="true" />}
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </Card>
      </div>
    </PageContainer>
  )
}