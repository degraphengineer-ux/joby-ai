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
      className={`rounded-lg border border-stone bg-white ${className}`}
      {...props}
    >
      {children}
    </Element>
  )
}
