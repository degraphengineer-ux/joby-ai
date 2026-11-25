import { LayoutDashboard, LogOut, Menu, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { ErrorState } from '../ui/Feedback'
import { PageContainer } from './PageContainer'
import { useAuth } from '../../features/auth/useAuth'
import { displayDatabaseError } from '../../lib/displayErrors'
import { ensureProfileExists, initialProfileName } from '../../features/profile/profileService'

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/skills', label: 'Skills' },
  { to: '/evidence', label: 'Evidence' },
  { to: '/assessments', label: 'Assessments' },
]

export function AuthenticatedLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    ensureProfileExists(user.id, initialProfileName(user))
      .then(() => {
        if (active) setProfileError(null)
      })
      .catch((cause: unknown) => {
        if (active) setProfileError(displayDatabaseError(cause))
      })
      .finally(() => {
        if (active) setIsProfileLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const retryProfileInitialization = async () => {
    if (!user) return
    setProfileError(null)
    setIsProfileLoading(true)
    try {
      await ensureProfileExists(user.id, initialProfileName(user))
    } catch (cause) {
      setProfileError(displayDatabaseError(cause))
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handleSignOut = async () => {
    setSignOutError(null)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out. Please try again.')
    }
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
      isActive ? 'bg-teal/10 text-teal' : 'text-slatebody hover:bg-navy/5 hover:text-navy'
    }`

  if (isProfileLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-warm" role="status">
        <p className="text-sm font-semibold text-slatebody">Preparing your private profile...</p>
      </div>
    )
  }

  if (profileError) {
    return (
      <PageContainer className="py-12">
        <div className="max-w-2xl space-y-4">
          <ErrorState>{profileError}</ErrorState>
          <Button variant="secondary" onClick={retryProfileInitialization}>
            Try preparing your profile again
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <div className="min-h-screen bg-warm">
      <header className="border-b border-navy/10 bg-white">
        <PageContainer className="flex min-h-[4.5rem] items-center justify-between gap-4">
          <NavLink
            to="/dashboard"
            className="flex shrink-0 items-center gap-2.5 rounded-lg text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
            aria-label="Joby AI overview"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white">
              <span className="text-sm font-bold">J</span>
            </span>
            <span className="font-bold tracking-tight">Joby AI</span>
          </NavLink>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {navigation.map(({ to, label }) => (
              <NavLink key={to} to={to} className={linkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <span className="max-w-40 truncate text-sm text-slatebody" title={user?.email ?? undefined}>
              {user?.email}
            </span>
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </Button>
          </div>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-lg border border-navy/10 text-navy hover:bg-navy/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal lg:hidden"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-app-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </PageContainer>

        {menuOpen && (
          <div id="mobile-app-navigation" className="border-t border-navy/10 bg-white lg:hidden">
            <PageContainer className="py-3">
              <nav className="grid grid-cols-2 gap-2" aria-label="Mobile navigation">
                {navigation.map(({ to, label }) => (
                  <NavLink key={to} to={to} className={linkClass} onClick={() => setMenuOpen(false)}>
                    {label}
                  </NavLink>
                ))}
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-slatebody hover:bg-navy/5 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} aria-hidden="true" />
                  Sign out
                </button>
              </nav>
              <p className="mt-3 truncate px-3 text-xs text-slatebody">{user?.email}</p>
            </PageContainer>
          </div>
        )}
      </header>

      {signOutError && (
        <PageContainer className="pt-4">
          <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
            {signOutError}
          </div>
        </PageContainer>
      )}
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-navy/10 bg-white py-6">
        <PageContainer className="flex flex-col gap-2 text-sm text-slatebody sm:flex-row sm:items-center sm:justify-between">
          <p>Joby AI — Your skills deserve to be seen.</p>
          <p>AI-assisted validation supports evidence; it does not replace human judgment.</p>
        </PageContainer>
      </footer>
    </div>
  )
}
