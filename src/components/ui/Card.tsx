import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  as?: 'article' | 'div' | 'section'
}

export function Card({
  children,
  as: Element = 'div',
  className = '',
  ...props
}: CardProps) {
  return (
    <Element
      className={`rounded-xl border border-navy/10 bg-white ${className}`}
      {...props}
    >
      {children}
    </Element>
  )
}
