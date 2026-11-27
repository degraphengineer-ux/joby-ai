import {
  AssessmentsFilled,
  ChevronRight,
  DashboardFilled,
  EvidenceFilled,
  MenuAlt,
  MoreFilled,
  PassportFilled,
  Search,
  SidebarLayoutFilled,
  SettingsFilled,
  SkillsFilled,
  SparklesFilled,
  X,
  type IconComponent,
} from '../ui/icons'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { ErrorState } from '../ui/Feedback'
import { JobyLogo } from '../ui/JobyLogo'
import { PageContainer } from './PageContainer'
import { useAuth } from '../../features/auth/useAuth'
import { displayDatabaseError } from '../../lib/displayErrors'
import { ensureProfileExists, initialProfileName } from '../../features/profile/profileService'

const navigation: { to: string; label: string; icon: IconComponent }[] = [
  { to: '/dashboard', label: 'Overview', icon: DashboardFilled },
  { to: '/ai', label: 'Joby AI', icon: SparklesFilled },
  { to: '/skills', label: 'Skills', icon: SkillsFilled },
  { to: '/evidence', label: 'Evidence', icon: EvidenceFilled },
  { to: '/assessments', label: 'Assessments', icon: AssessmentsFilled },
  { to: '/passport', label: 'Passport', icon: PassportFilled },
  { to: '/settings', label: 'Settings', icon: SettingsFilled },
]

export function AuthenticatedLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const accountButtonRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isSidebarVisuallyCollapsed = sidebarCollapsed
  const [navigationSearch, setNavigationSearch] = useState('')
  const [navigationMoreOpen, setNavigationMoreOpen] = useState(false)
  const [accountExpanded, setAccountExpanded] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
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
    setIsSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  useEffect(() => {
    if (!menuOpen && !accountExpanded) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (accountExpanded) {
          setAccountExpanded(false)
          accountButtonRef.current?.focus()
        } else {
          setMenuOpen(false)
          mobileMenuButtonRef.current?.focus()
        }
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [accountExpanded, menuOpen])

  const activePage = navigation.find(({ to }) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`),
  )
  const activeNavigationIndex = navigation.findIndex(({ to }) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`),
  )
  useEffect(() => {
    if (activeNavigationIndex >= 5) setNavigationMoreOpen(true)
  }, [activeNavigationIndex])

  useEffect(() => {
    if (!accountExpanded) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setAccountExpanded(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [accountExpanded])

  const matchingNavigation = navigation.filter(({ label }) =>
    label.toLowerCase().includes(navigationSearch.trim().toLowerCase()),
  )
  const primaryNavigation = matchingNavigation.slice(0, 5)
  const additionalNavigation = matchingNavigation.slice(5)
  const hasMoreNavigation = matchingNavigation.length > 5
  const metadataName = user?.user_metadata?.full_name
  const accountName = typeof metadataName === 'string' && metadataName.trim()
    ? metadataName.trim()
    : user?.email?.split('@')[0] ?? 'Your account'
  const accountInitial = accountName.trim().charAt(0).toUpperCase() || 'J'
  const closeNavigation = () => {
    setMenuOpen(false)
    if (window.matchMedia('(max-width: 900px)').matches) {
      window.requestAnimationFrame(() => document.getElementById('main-content')?.focus())
    }
  }

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
    <div className={`app-shell bg-warm${sidebarCollapsed ? ' app-shell--collapsed' : ''}`}>
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-white px-4 py-3 font-semibold text-navy shadow-soft focus:not-sr-only focus:outline focus:outline-2 focus:outline-teal"
      >
        Skip to main content
      </a>
      {menuOpen && (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => {
            setMenuOpen(false)
            mobileMenuButtonRef.current?.focus()
          }}
        />
      )}
      <aside
        id="app-sidebar"
        className={`app-sidebar${menuOpen ? ' app-sidebar--open' : ''}${sidebarCollapsed ? ' app-sidebar--collapsed' : ''}`}
        aria-label="Workspace navigation"
      >
        <div className="app-sidebar__header">
          <NavLink to="/dashboard" className="app-sidebar__brand" aria-label="Joby AI overview">
            <JobyLogo className="h-7 w-7" />
            <span className="app-sidebar__copy">Joby AI</span>
          </NavLink>
          <button
            type="button"
            className="app-sidebar__collapse"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            aria-controls="app-sidebar"
            onClick={() => {
              setSidebarCollapsed((collapsed) => !collapsed)
              setNavigationSearch('')
            }}
          >
            <SidebarLayoutFilled
              size={18}
              className={sidebarCollapsed ? 'rotate-180' : ''}
              aria-hidden="true"
            />
          </button>
        </div>
        <label className="app-sidebar__search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={navigationSearch}
            onChange={(event) => setNavigationSearch(event.target.value)}
            placeholder="Search navigation..."
            aria-label="Search navigation"
          />
        </label>
        <p className="app-sidebar__label">Workspace</p>
        <nav className="app-sidebar__nav" aria-label="Main navigation">
          {primaryNavigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className="app-sidebar__link"
              aria-label={label}
              title={isSidebarVisuallyCollapsed ? label : undefined}
              onClick={closeNavigation}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="app-sidebar__copy">{label}</span>
            </NavLink>
          ))}
          {primaryNavigation.length === 0 && (
            <p className="app-sidebar__empty">No matching pages</p>
          )}
          {hasMoreNavigation && (
            <button
              type="button"
              className="app-sidebar__link app-sidebar__more"
              aria-label={navigationMoreOpen ? 'Show less' : 'More'}
              aria-expanded={navigationMoreOpen}
              onClick={() => setNavigationMoreOpen((open) => !open)}
            >
              <MoreFilled className="app-sidebar__more-mark" size={20} aria-hidden="true" />
              <span className="app-sidebar__copy">{navigationMoreOpen ? 'Show less' : 'More'}</span>
              <ChevronRight
                size={16}
                className={`app-sidebar__more-chevron${navigationMoreOpen ? ' app-sidebar__more-chevron--open' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
          {navigationMoreOpen && additionalNavigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className="app-sidebar__link"
              aria-label={label}
              title={sidebarCollapsed ? label : undefined}
              onClick={closeNavigation}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="app-sidebar__copy">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar__footer">
          <div ref={accountMenuRef} className="app-sidebar__account">
            <button
              ref={accountButtonRef}
              type="button"
              className="app-sidebar__account-trigger"
              aria-expanded={accountExpanded}
              aria-controls="app-account-details"
              onClick={() => setAccountExpanded((expanded) => !expanded)}
            >
              <span className="app-sidebar__avatar" aria-hidden="true">{accountInitial}</span>
              <span className="app-sidebar__account-copy app-sidebar__copy">
                <span className="app-sidebar__account-name">{accountName}</span>
                <span className="app-sidebar__account-email">{user?.email}</span>
              </span>
            </button>
            {accountExpanded && (
              <div id="app-account-details" className="app-sidebar__account-details">
                <div className="app-sidebar__account-info">
                  <span className="app-sidebar__account-info-name">{accountName}</span>
                  <span className="app-sidebar__account-info-value">{user?.email ?? 'No email available'}</span>
                </div>
                <NavLink
                  to="/settings"
                  className="app-sidebar__account-action"
                  onClick={() => {
                    setAccountExpanded(false)
                    closeNavigation()
                  }}
                >
                  User settings
                </NavLink>
                <button
                  type="button"
                  className="app-sidebar__account-action"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="app-mobile-menu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <MenuAlt size={20} aria-hidden="true" />}
          </button>
          <div>
            <p className="text-xs text-slatebody">Workspace</p>
            <p className="text-sm font-semibold text-navy">{activePage?.label ?? 'Overview'}</p>
          </div>
        </header>
        {signOutError && (
          <PageContainer className="pt-4">
            <div className="rounded-md border border-error/20 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
              {signOutError}
            </div>
          </PageContainer>
        )}
        <main id="main-content" className="app-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <p>Joby AI — Your skills deserve to be seen.</p>
          <p>AI-assisted validation supports evidence; it does not replace human judgment.</p>
        </footer>
      </div>
    </div>
  )
}
