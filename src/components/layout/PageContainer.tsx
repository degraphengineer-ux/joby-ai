import type { HTMLAttributes, ReactNode } from 'react'

type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function PageContainer({
  children,
  className = '',
  ...props
}: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
