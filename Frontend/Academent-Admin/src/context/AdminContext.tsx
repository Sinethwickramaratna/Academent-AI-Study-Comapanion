import { useMemo, useState, type ReactNode } from 'react'
import type { AdminSession } from '../types/admin'
import { AdminContext, type AdminContextValue } from './adminContextValue'

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AdminSession | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  const value = useMemo<AdminContextValue>(
    () => ({
      session,
      sessionExpired,
      setSession: (nextSession) => {
        setSessionState(nextSession)
        setSessionExpired(false)
      },
      expireSession: () => {
        setSessionState(null)
        setSessionExpired(true)
      },
      clearSession: () => {
        setSessionState(null)
        setSessionExpired(false)
      },
    }),
    [session, sessionExpired],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
