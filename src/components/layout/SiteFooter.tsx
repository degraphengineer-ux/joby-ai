import { PageContainer } from './PageContainer'

export function SiteFooter() {
  return (
    <footer className="border-t border-navy/10 bg-white">
      <PageContainer className="flex flex-col gap-5 py-8 text-sm text-slatebody md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-bold text-navy">Joby AI</p>
          <p className="mt-1">Your skills deserve to be seen.</p>
          <p className="mt-2 max-w-md text-xs leading-5">
            Private by default. Share only what you choose; uploaded evidence files remain private.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer navigation">
          <a className="hover:text-navy" href="#how-it-works">How it works</a>
          <a className="hover:text-navy" href="#trust">Trust and transparency</a>
          <a className="hover:text-navy" href="#top">Back to top</a>
        </nav>
      </PageContainer>
    </footer>
  )
}
