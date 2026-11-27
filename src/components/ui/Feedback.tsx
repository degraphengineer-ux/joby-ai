import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  const indicatorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const indicator = indicatorRef.current
    if (!indicator) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to(indicator.children, {
        y: -4,
        scale: 1.15,
        opacity: 1,
        duration: 0.35,
        ease: 'sine.inOut',
        stagger: {
          each: 0.12,
          yoyo: true,
          repeat: 1,
        },
        repeat: -1,
        repeatDelay: 0.12,
      })
    })

    return () => media.revert()
  }, [])

  return (
    <div className="flex items-center gap-3 rounded-xl border border-navy/10 bg-white p-6 text-sm text-slatebody" role="status">
      <span ref={indicatorRef} className="inline-flex shrink-0 items-center gap-1" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-coral opacity-60" />
        <span className="h-2 w-2 rounded-full bg-coral opacity-60" />
        <span className="h-2 w-2 rounded-full bg-coral opacity-60" />
      </span>
      <span>{label}</span>
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
