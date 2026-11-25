import { ArrowLeft, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { PageContainer } from '../../components/layout/PageContainer'
import { useAuth } from './useAuth'

const routeLabels: Record<string, string> = {
  onboarding: 'Onboarding',
  dashboard: 'Dashboard',
  skills: 'My Skills',
  evidence: 'Evidence',
  assessments: 'Assessments',
  passport: 'Skills Passport',
  settings: 'Settings',
}

export function AccountPlaceholder({ route }: { route: string }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setError(null)
    setIsSigningOut(true)
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch {
      setError('Sign-out failed. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-warm">
      <header className="border-b border-navy/10 bg-white">
        <PageContainer className="flex min-h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-navy">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy text-sm text-white">J</span>
            Joby AI
          </Link>
          <Button size="md" variant="secondary" onClick={handleSignOut} disabled={isSigningOut}>
            <LogOut size={16} aria-hidden="true" />
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </PageContainer>
      </header>

      <PageContainer className="py-12">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-navy hover:text-teal"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Joby AI
        </Link>
        <section className="mt-8 max-w-2xl rounded-xl border border-navy/10 bg-white p-6 shadow-card sm:p-8">
          <p className="text-sm font-bold text-teal">{routeLabels[route]}</p>
          <h1 className="mt-2 text-3xl font-bold text-navy">Authenticated workspace</h1>
          <p className="mt-4 leading-7 text-slatebody">
            This route is protected and your session is active. This phase does not implement
            profile, skills or evidence management.
          </p>
          {user?.email && (
            <p className="mt-5 text-sm text-slatebody">
              Signed in as <span className="font-semibold text-navy">{user.email}</span>
            </p>
          )}
          {error && (
            <p className="mt-4 text-sm text-error" role="alert">
              {error}
            </p>
          )}
        </section>
      </PageContainer>
    </main>
  )
}
