import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { ErrorState, LoadingState } from '../../components/ui/Feedback'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import { getImpactMetrics, type ImpactMetrics } from './impactService'

const metricLabels: Array<{ key: keyof ImpactMetrics; label: string; detail: string }> = [
  { key: 'profiles_created', label: 'Candidate profiles', detail: 'Current profile records' },
  { key: 'skills_added', label: 'Skills added', detail: 'Current skill records' },
  { key: 'ai_suggested_skills_saved', label: 'AI-suggested skills saved', detail: 'User-approved suggestions' },
  { key: 'evidence_submitted', label: 'Evidence items', detail: 'Current submitted records' },
  { key: 'assessments_started', label: 'Assessment attempts', detail: 'All recorded attempts' },
  { key: 'assessments_completed', label: 'Assessments completed', detail: 'Completed attempts' },
  { key: 'public_passports_shared', label: 'Public Passports', detail: 'Currently shared profiles' },
]

export function ImpactDashboardPage() {
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getImpactMetrics()
      .then((result) => {
        if (active) setMetrics(result)
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
  }, [])

  return (
    <PageContainer className="max-w-5xl py-8 sm:py-12">
      <PageHeading
        title="Product impact"
        description="Aggregated counts of real Joby AI records. These measures describe product activity, not employment outcomes."
      />
      {error && <div className="mb-5"><ErrorState>{error}</ErrorState></div>}
      {isLoading ? (
        <LoadingState label="Loading aggregated product metrics..." />
      ) : metrics ? (
        <>
          <section aria-label="Aggregated product metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metricLabels.map(({ key, label, detail }) => (
              <Card key={key} className="p-5 shadow-card">
                <p className="text-sm font-semibold text-slatebody">{label}</p>
                <p className="mt-2 text-3xl font-bold text-navy">{metrics[key].toLocaleString()}</p>
                <p className="mt-1 text-xs text-slatebody">{detail}</p>
              </Card>
            ))}
          </section>
          <p className="mt-6 max-w-3xl text-sm leading-6 text-slatebody">
            Metrics contain no names or account identifiers. Profile, skill, evidence and public-sharing counts reflect current records; no job placements, interviews, or other outcomes are measured here.
          </p>
        </>
      ) : (
        <Card className="p-5">
          <p className="text-sm text-slatebody">{error ?? 'Aggregated metrics are unavailable.'}</p>
        </Card>
      )}
    </PageContainer>
  )
}
