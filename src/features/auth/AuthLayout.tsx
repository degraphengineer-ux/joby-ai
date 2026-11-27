import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { JobyLogo } from '../../components/ui/JobyLogo'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-white px-4 py-3 font-semibold text-navy shadow-soft focus:not-sr-only focus:outline focus:outline-2 focus:outline-teal"
      >
        Skip to main content
      </a>
      <main id="main-content" tabIndex={-1} className="relative flex min-h-screen flex-col items-center bg-warm px-5 py-8 sm:py-12">
        <Link
          to="/"
          className="absolute left-4 top-4 rounded-lg px-3 py-2 text-sm font-semibold text-slatebody transition-colors hover:bg-white hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral sm:left-8 sm:top-8"
        >
          Back to Joby AI
        </Link>
        <Link to="/" className="mt-10 inline-flex items-center gap-2 rounded-lg text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:mt-4" aria-label="Joby AI home">
          <JobyLogo className="h-10 w-10" />
          <span className="text-xl font-bold tracking-tight">Joby AI</span>
        </Link>
        <div className="my-auto flex w-full max-w-md flex-col justify-center py-10">
          {children}
          <p className="mt-8 text-center text-xs leading-5 text-slatebody">
            Evidence-first skills profiles <span aria-hidden="true">·</span> Private by default
          </p>
        </div>
      </main>
    </>
  )
}
