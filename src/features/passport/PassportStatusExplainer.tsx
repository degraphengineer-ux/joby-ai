import { Card } from '../../components/ui/Card'
import { EvidenceStatusBadge } from '../../components/ui/EvidenceStatusBadge'

const descriptions = [
  {
    label: 'Self-reported' as const,
    description: 'The proficiency was selected by the candidate.',
  },
  {
    label: 'Evidence submitted' as const,
    description: 'The candidate shared a work sample. Submission alone does not verify its quality or authorship.',
  },
  {
    label: 'AI-assisted assessment' as const,
    description: 'An AI-assisted rubric review is advisory and is not an official certification.',
  },
  {
    label: 'Human reviewed' as const,
    description: 'A review record exists. It does not imply an official qualification.',
  },
  {
    label: 'External credential' as const,
    description: 'Use only after a documented external verification process. No credential is marked this way automatically.',
  },
]

export function PassportStatusExplainer() {
  return (
    <Card as="section" aria-labelledby="passport-status-heading" className="p-5 shadow-card sm:p-6">
      <h2 id="passport-status-heading" className="text-lg font-bold text-navy">
        What these statuses mean
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {descriptions.map(({ label, description }) => (
          <li key={label} className="space-y-2">
            <EvidenceStatusBadge label={label} />
            <p className="text-sm leading-6 text-slatebody">{description}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
