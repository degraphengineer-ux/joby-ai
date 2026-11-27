import { ChevronRight } from './icons'
import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  labelClassName?: string
  hint?: string
  children: ReactNode
}

export function SelectField({ label, labelClassName = '', hint, id, className = '', children, ...props }: SelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? props.name ?? generatedId
  return (
    <div className="space-y-2">
      {label && <label htmlFor={selectId} className={`block text-sm font-medium text-navy ${labelClassName}`}>{label}</label>}
      <span className="app-select__control">
        <select id={selectId} className={`app-select ${className}`} {...props}>
          {children}
        </select>
        <ChevronRight className="app-select__indicator" size={18} aria-hidden="true" />
      </span>
      {hint && <p className="text-sm text-slatebody">{hint}</p>}
    </div>
  )
}
