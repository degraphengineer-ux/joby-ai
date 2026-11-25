import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Feedback'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { displayDatabaseError } from '../../lib/displayErrors'
import type { Assessment } from './assessmentSchema'
import { listActiveAssessments } from './assessmentsService'

export function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listActiveAssessments()
      .then((result) => {
        if (active) setAssessments(result)
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(displayDatabaseError(cause))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const retryLoad = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      setAssessments(await listActiveAssessments())
    } catch (cause) {
      setLoadError(displayDatabaseError(cause))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageContainer className="py-8 sm:py-12">
      <PageHeading
        title="Practical assessments"
        description="Explore structured tasks with clear instructions and fixed criteria. Starting a task saves an attempt to your account."
      />
      {isLoading ? (
        <LoadingState label="Loading active assessments..." />
      ) : loadError ? (
        <div className="space-y-4">
          <ErrorState>{loadError}</ErrorState>
          <Button variant="secondary" onClick={retryLoad}>Try loading assessments again</Button>
        </div>
      ) : assessments.length === 0 ? (
        <EmptyState title="No active assessments are available">
          <p>Active assessment definitions will appear here when they are published.</p>
        </EmptyState>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {assessments.map((assessment) => (
            <li key={assessment.id}>
              <Card as="article" className="flex h-full flex-col p-5 shadow-card sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="teal">{assessment.difficulty}</Badge>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slatebody">
                    {assessment.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold text-navy">{assessment.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-slatebody">{assessment.description}</p>
                <p className="mt-4 text-xs leading-5 text-slatebody">
                  <span className="font-bold text-navy">Expected deliverable:</span>{' '}
                  {assessment.expected_deliverable}
                </p>
                <Link
                  to={`/assessments/${assessment.id}`}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-navy/15 px-4 text-sm font-bold text-navy hover:border-teal/50 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                >
                  Review task and rubric
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-7 text-sm leading-6 text-slatebody">
        An assessment is a structured exercise, not a certificate. Results are advisory and must not be presented as an official qualification.
      </p>
    </PageContainer>
  )
}
