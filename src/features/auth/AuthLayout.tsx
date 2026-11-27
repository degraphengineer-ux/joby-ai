import { ArrowLeft, ShieldCheck } from '../../components/ui/icons'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../../components/layout/PageContainer'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-white px-4 py-3 font-semibold text-navy shadow-soft focus:not-sr-only focus:outline focus:outline-2 focus:outline-teal"
      >
        Skip to main content
      </a>
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-warm">
      <PageContainer className="py-5 sm:py-8">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-navy hover:bg-navy/5"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Joby AI
        </Link>
      </PageContainer>
      <div className="mx-auto grid max-w-6xl px-5 pb-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <div className="hidden border-r border-navy/10 pr-12 lg:block">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-white">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Evidence-first
          </p>
          <h1 className="mt-3 max-w-md text-4xl font-bold leading-tight text-navy">
            Give your practical skills a clear place to be seen.
          </h1>
          <p className="mt-5 max-w-md leading-7 text-slatebody">
            Private by default. AI suggestions remain subject to your review.
          </p>
        </div>
        <div className="mx-auto w-full max-w-md lg:pl-12">{children}</div>
      </div>
      </main>
    </>
  )
}
