import { Menu, X } from '../ui/icons'
import { useEffect, useState } from 'react'
import { ButtonLink } from '../ui/Button'
import { JobyLogo } from '../ui/JobyLogo'
import { PageContainer } from './PageContainer'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-white/95 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-white px-4 py-3 font-semibold text-navy shadow-soft focus:not-sr-only focus:outline focus:outline-2 focus:outline-teal"
      >
        Skip to main content
      </a>
      <PageContainer className="flex h-[4.5rem] items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 rounded-lg font-bold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal" aria-label="Joby AI home">
          <JobyLogo />
          <span className="text-xl tracking-tight">Joby AI</span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          <a className="nav-link" href="#features">Platform</a>
          <a className="nav-link" href="#how-it-works">How it works</a>
          <a className="nav-link" href="#trust">Trust</a>
          <a className="nav-link" href="/login">Sign in</a>
          <ButtonLink href="/signup" variant="primary">Get started</ButtonLink>
        </nav>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-lg text-navy hover:bg-navy/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </PageContainer>

      {open && (
        <nav
          id="mobile-navigation"
          className="border-t border-navy/5 bg-white lg:hidden"
          aria-label="Mobile navigation"
        >
          <PageContainer className="flex flex-col gap-1 py-4">
            {[
              ['Platform', '#features'],
              ['How it works', '#how-it-works'],
              ['Trust', '#trust'],
              ['Sign in', '/login'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-3 font-medium text-navy hover:bg-warm"
                onClick={() => setOpen(false)}
              >
                {label}
              </a>
            ))}
            <ButtonLink href="/signup" variant="primary" className="mt-3" onClick={() => setOpen(false)}>
              Get started
            </ButtonLink>
          </PageContainer>
        </nav>
      )}
    </header>
  )
}
