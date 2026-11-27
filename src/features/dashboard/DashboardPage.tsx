import { ArrowRight, Award, BriefcaseBusiness, FileText, Plus, Sparkles } from '../../components/ui/icons'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Feedback'
import { StatCard } from '../../components/ui/StatCard'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import { useAuth } from '../auth/useAuth'
import { getDashboardData, type DashboardData } from './dashboardService'

function completionPercent(data: DashboardData) {
  const checks = [
    Boolean(data.profile?.display_name),
    Boolean(data.profile?.headline),
    Boolean(data.profile?.bio),
    Boolean(data.profile?.target_role),
    data.skillCount > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function recommendation(data: DashboardData) {
  if (!data.profile?.display_name || completionPercent(data) < 60) {
    return {
      title: 'Complete your profile',
      body: 'A clear headline, a short bio and your target role help people understand your direction.',
      href: '/onboarding',
      label: 'Continue setup',
      icon: BriefcaseBusiness,
    }
  }
  if (data.skillCount === 0) {
    return {
      title: 'Add your first skill',
      body: 'Start with skills you use in practice. You can describe your experience and self-report a level.',
      href: '/skills',
      label: 'Add a skill',
      icon: Sparkles,
    }
  }
  if (data.evidenceCount === 0) {
    return {
      title: 'Add a work sample',
      body: 'Connect a project, work description or other evidence to give your skills more context.',
      href: '/evidence',
      label: 'Add evidence',
      icon: FileText,
    }
  }
  if (data.completedAssessmentCount === 0) {
    return {
      title: 'Try a practical assessment',
      body: 'Start a structured task and see its instructions and rubric before you begin.',
      href: '/assessments',
      label: 'Browse assessments',
      icon: Award,
    }
  }
  return {
    title: 'Keep your profile current',
    body: 'Review your skills and add context as you gain more practical experience.',
    href: '/skills',
    label: 'Review skills',
    icon: Sparkles,
  }
}

export function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    getDashboardData(user.id)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((cause: unknown) => {
        if (active) setError(displayDatabaseError(cause))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const firstName = data?.profile?.display_name.trim().split(/\s+/)[0]
  const next = data ? recommendation(data) : null
  const NextIcon = next?.icon

  return (
    <PageContainer className="py-8 sm:py-12">
      <PageHeading
        title={firstName ? `Welcome, ${firstName}` : 'Your dashboard'}
        description="A clear view of your skills and practical progress."
      />
      {error && <div className="mb-6"><ErrorState>{error}</ErrorState></div>}
      {isLoading ? (
        <LoadingState label="Loading your dashboard from your account..." />
      ) : data ? (
        <>
          <section aria-label="Your profile progress" className="mb-7">
            <Card className="flex flex-col gap-5 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-navy">Profile progress</h2>
                  <Badge tone="teal">{completionPercent(data)}% complete</Badge>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slatebody">
                  Add a headline, short bio, target role and at least one skill to give your profile helpful context.
                </p>
              </div>
              <Link to="/onboarding" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-navy/15 px-4 text-sm font-semibold text-navy hover:border-teal/50 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal">
                Edit profile
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </Card>
          </section>

          <section aria-label="Account totals" className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Skills" value={data.skillCount} href="/skills" icon={<Sparkles size={19} aria-hidden="true" />} />
            <StatCard label="Evidence items" value={data.evidenceCount} href="/evidence" icon={<FileText size={19} aria-hidden="true" />} />
            <StatCard label="Completed assessments" value={data.completedAssessmentCount} href="/assessments" icon={<Award size={19} aria-hidden="true" />} />
          </section>

          {next && NextIcon && (
            <section aria-label="Recommended next step" className="mt-7">
              <Card className="border-navy bg-navy p-6 text-white shadow-card sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-teal">
                    <NextIcon size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-teal-200">Recommended next step</p>
                    <h2 className="mt-1 text-xl font-bold">{next.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{next.body}</p>
                  </div>
                </div>
                <Link
                  to={next.href}
                  className="mt-5 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-navy hover:bg-teal/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:mt-0"
                >
                  {next.label}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </Card>
            </section>
          )}

          <section className="mt-7 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-navy">Recent activity</h2>
                <span className="text-sm text-slatebody">From your saved records</span>
              </div>
              {data.activities.length ? (
                <ul className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-white">
                  {data.activities.map((activity) => (
                    <li key={activity.id}>
                      <Link
                        to={activity.href}
                        className="flex min-h-[4.75rem] min-w-0 items-center justify-between gap-4 rounded-md px-4 py-4 hover:bg-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:px-5"
                      >
                        <span className="min-w-0">
                          <span className="block break-words text-sm font-semibold text-navy hover:text-teal-700">
                            {activity.label}
                          </span>
                          <span className="mt-1 block text-xs text-slatebody">
                            {new Date(activity.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>
                        <ArrowRight size={16} className="shrink-0 text-slatebody" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Your activity will appear here">
                  <p>As you add skills and start assessments, your latest updates will show up in this list.</p>
                </EmptyState>
              )}
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold text-navy">Quick actions</h2>
              <div className="space-y-3">
                <QuickAction href="/skills" label="Add a skill" detail="Record a skill you use" />
                <QuickAction href="/assessments" label="Start an assessment" detail="Explore practical tasks" />
                <QuickAction href="/evidence" label="Add evidence" detail="Add a project link, file or work description" />
              </div>
              <p className="mt-4 text-xs leading-5 text-slatebody">
                Assessment feedback will be AI-assisted and advisory, not an official certification.
              </p>
            </div>
          </section>
        </>
      ) : (
        <Card className="p-6">
          <h2 className="font-bold text-navy">Your dashboard could not be loaded.</h2>
          <p className="mt-2 text-sm leading-6 text-slatebody">
            {error ?? 'Please refresh the page to try again.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => window.location.reload()}>Reload dashboard</Button>
            <Link to="/onboarding" className="inline-flex min-h-10 items-center text-sm font-semibold text-teal-700 hover:text-navy">
              Continue profile setup
            </Link>
          </div>
        </Card>
      )}
    </PageContainer>
  )
}

function QuickAction({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link
      to={href}
      className="flex min-h-[4.5rem] items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white px-4 py-3 hover:border-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
    >
      <span className="flex items-start gap-3">
        <Plus size={17} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
        <span>
          <span className="block text-sm font-bold text-navy">{label}</span>
          <span className="mt-1 block text-xs text-slatebody">{detail}</span>
        </span>
      </span>
      <ArrowRight size={16} className="shrink-0 text-slatebody" aria-hidden="true" />
    </Link>
  )
}
