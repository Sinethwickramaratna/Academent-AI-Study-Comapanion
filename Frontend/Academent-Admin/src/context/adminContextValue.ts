import { createContext } from 'react'
import type { AdminSession } from '../types/admin'

export interface AdminContextValue {
  session: AdminSession | null
  sessionExpired: boolean
  setSession: (session: AdminSession | null) => void
  expireSession: () => void
  clearSession: () => void
}

export const AdminContext = createContext<AdminContextValue | undefined>(undefined)
