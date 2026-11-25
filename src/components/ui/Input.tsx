import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
}

export function Input({ label, hint, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-semibold text-navy">
        {label}
      </label>
      <input
        id={inputId}
        className={`min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none placeholder:text-slatebody/60 focus:border-teal focus:ring-4 focus:ring-teal/10 ${className}`}
        {...props}
      />
      {hint && <p className="text-sm text-slatebody">{hint}</p>}
    </div>
  )
}
