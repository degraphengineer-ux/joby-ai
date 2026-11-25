import type { HTMLAttributes, ReactNode } from 'react'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
  tone?: 'navy' | 'teal' | 'warm' | 'slate'
}

const tones = {
  navy: 'border-navy/10 bg-navy text-white',
  teal: 'border-teal/15 bg-teal/10 text-teal',
  warm: 'border-navy/10 bg-warm text-navy',
  slate: 'border-navy/10 bg-slate-100 text-slatebody',
}

export function Badge({
  children,
  tone = 'warm',
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
