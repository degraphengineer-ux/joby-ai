import { ArrowRight, FileText } from '../../components/ui/icons'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'

const pageContent: Record<'passport' | 'settings', { title: string; description: string }> = {
  passport: {
    title: 'Skills Passport is not set up yet',
    description: 'Public profile sharing will be implemented in a later phase. Your profile remains private.',
  },
  settings: {
    title: 'Settings are not available yet',
    description: 'Account settings will be added in a later phase.',
  },
}

export function ComingSoonPage({ route }: { route: 'passport' | 'settings' }) {
  const content = pageContent[route]

  return (
    <PageContainer className="max-w-3xl py-8 sm:py-12">
      <PageHeading title={content.title} description={content.description} />
      <Card className="p-6 shadow-card sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal/10 text-teal">
          <FileText size={22} aria-hidden="true" />
        </span>
        <p className="mt-4 leading-7 text-slatebody">
          You can continue building your profile by adding skills, submitting private evidence or starting a practical assessment. These actions save only the records described on their respective pages.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/skills" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
            Manage skills
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/evidence" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-navy/15 px-4 text-sm font-semibold text-navy hover:border-teal/50 hover:text-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal">
            Manage evidence
          </Link>
          <Link to="/assessments" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-navy/15 px-4 text-sm font-semibold text-navy hover:border-teal/50 hover:text-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal">
            Browse assessments
          </Link>
        </div>
      </Card>
    </PageContainer>
  )
}
