import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ButtonLink } from '../ui/Button'
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
    <header className="sticky top-0 z-50 border-b border-navy/5 bg-white/95 backdrop-blur">
      <PageContainer className="flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 font-bold text-navy" aria-label="Joby AI home">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy text-sm text-white">J</span>
          <span className="text-lg tracking-tight">Joby AI</span>
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          <a className="nav-link" href="#how-it-works">How it works</a>
          <a className="nav-link" href="#features">What you can build</a>
          <a className="nav-link" href="#trust">Trust</a>
          <ButtonLink href="/signup" variant="primary">Build my passport</ButtonLink>
        </nav>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-lg text-navy hover:bg-navy/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal md:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </PageContainer>

      {open && (
        <nav
          id="mobile-navigation"
          className="border-t border-navy/5 bg-white md:hidden"
          aria-label="Mobile navigation"
        >
          <PageContainer className="flex flex-col gap-1 py-4">
            {[
              ['How it works', '#how-it-works'],
              ['What you can build', '#features'],
              ['Trust', '#trust'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-3 font-medium text-navy hover:bg-navy/5"
                onClick={() => setOpen(false)}
              >
                {label}
              </a>
            ))}
            <ButtonLink href="/signup" variant="primary" className="mt-3" onClick={() => setOpen(false)}>
              Build my passport
            </ButtonLink>
          </PageContainer>
        </nav>
      )}
    </header>
  )
}
