type EvidenceStatusBadgeProps = {
  label:
    | 'Self-reported'
    | 'Evidence submitted'
    | 'AI-assisted assessment'
    | 'Human reviewed'
    | 'External credential'
}

const dotStyles = {
  'Self-reported': 'bg-slatebody',
  'Evidence submitted': 'bg-teal',
  'AI-assisted assessment': 'bg-navy',
  'Human reviewed': 'bg-success',
  'External credential': 'bg-warning',
}

export function EvidenceStatusBadge({ label }: EvidenceStatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-stone bg-white px-2.5 py-1 text-xs font-medium text-navy">
      <span className={`h-2 w-2 rounded-full ${dotStyles[label]}`} aria-hidden="true" />
      {label}
    </span>
  )
}
