import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-warm" role="status">
        <p className="text-sm font-semibold text-slatebody">Restoring your session...</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
