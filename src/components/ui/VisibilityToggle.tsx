import { LoaderCircle } from 'lucide-react'

type VisibilityToggleProps = {
  checked: boolean
  disabled?: boolean
  busy?: boolean
  label: string
  onChange: (checked: boolean) => void
}

export function VisibilityToggle({
  checked,
  disabled = false,
  busy = false,
  label,
  onChange,
}: VisibilityToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-11 items-center gap-3 rounded-lg px-2 py-1 text-sm font-semibold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          checked ? 'bg-teal' : 'bg-slate-400'
        }`}
      >
        {busy ? (
          <LoaderCircle size={16} className="absolute left-1/2 -translate-x-1/2 animate-spin text-white" />
        ) : (
          <span
            className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        )}
      </span>
      <span>{busy ? 'Saving…' : checked ? 'On' : 'Off'}</span>
    </button>
  )
}
