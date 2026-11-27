import { LoaderCircle } from './icons'
import { useEffect, useRef } from 'react'
import { Button } from './Button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  isConfirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onCancel={(event) => {
        event.preventDefault()
        if (!isConfirming) onCancel()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !isConfirming) onCancel()
      }}
      className="w-[calc(100%-2rem)] max-w-lg rounded-xl border border-navy/10 bg-white p-0 text-navy shadow-soft backdrop:bg-navy/40"
    >
      <div className="p-5 sm:p-6">
        <h2 id="confirm-dialog-title" className="text-lg font-bold">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-slatebody">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={isConfirming} autoFocus>
            {cancelLabel}
          </Button>
          <Button
            className="bg-error hover:bg-error"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
