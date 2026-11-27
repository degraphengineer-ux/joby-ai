import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type SharedProps = {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'lg'
  className?: string
}

type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement>
type ButtonLinkProps = SharedProps & AnchorHTMLAttributes<HTMLAnchorElement>

const styles = {
  primary:
    'bg-coral text-navy hover:bg-teal-600 focus-visible:outline-coral',
  secondary:
    'border border-stone bg-white text-navy hover:border-coral hover:bg-warm',
  ghost:
    'text-navy hover:bg-stone/40 focus-visible:outline-coral',
}

function classes({
  variant = 'primary',
  size = 'md',
  className = '',
}: SharedProps) {
  return [
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-60',
    size === 'lg' ? 'min-h-12 px-5 text-base' : 'min-h-10 px-4 text-sm',
    styles[variant],
    className,
  ].join(' ')
}

export function Button({
  children,
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes({ children, variant, size, className })}
      {...props}
      data-gsap-hover
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  children,
  variant,
  size,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={classes({ children, variant, size, className })}
      {...props}
      data-gsap-hover
    >
      {children}
    </a>
  )
}
