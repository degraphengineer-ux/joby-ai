import type { ReactNode } from 'react'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white p-6 text-sm text-slatebody" role="status">
      {label}
    </div>
  )
}

export function ErrorState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-error/20 bg-error/5 p-4 text-sm leading-6 text-error" role="alert">
      {children}
    </div>
  )
}

export function SuccessState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-sm leading-6 text-success" role="status" aria-live="polite">
      {children}
    </div>
  )
}

export function Toast({
  children,
  tone = 'success',
}: {
  children: ReactNode
  tone?: 'success' | 'error'
}) {
  const styles = tone === 'error'
    ? 'border-error/20 bg-error/5 text-error'
    : 'border-success/20 bg-success/5 text-success'

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm leading-6 ${styles}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </div>
  )
}

export function EmptyState({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-navy/20 bg-white px-6 py-10 text-center">
      <h2 className="font-bold text-navy">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-slatebody">{children}</div>
    </div>
  )
}
