type EvidenceStatusBadgeProps = {
  label: 'Self-reported' | 'Evidence submitted' | 'AI-assisted assessment'
}

const dotStyles = {
  'Self-reported': 'bg-slate-400',
  'Evidence submitted': 'bg-teal',
  'AI-assisted assessment': 'bg-navy',
}

export function EvidenceStatusBadge({ label }: EvidenceStatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white px-3 py-1.5 text-xs font-semibold text-navy">
      <span className={`h-2 w-2 rounded-full ${dotStyles[label]}`} aria-hidden="true" />
      {label}
    </span>
  )
}
