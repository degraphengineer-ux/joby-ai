import type { HTMLAttributes, ReactNode } from 'react'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
  tone?: 'navy' | 'teal' | 'warm' | 'slate'
}

const tones = {
  navy: 'border-navy/10 bg-navy text-white',
  teal: 'border-coral/20 bg-teal-50 text-teal-800',
  warm: 'border-stone bg-warm text-navy',
  slate: 'border-stone bg-warm text-slatebody',
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
