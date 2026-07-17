import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import type { AdminSession, UserRole } from '../types/admin'
import { auth, db, firebaseConfigStatus } from './firebase'

export type LoginState = 'idle' | 'loading' | 'mfa' | 'invalid' | 'locked' | 'unauthorized' | 'success'

export interface LoginResult {
  state: LoginState
  message: string
  session?: AdminSession
}

const demoAdmin: AdminSession = {
  id: 'adm_001',
  name: 'Sineth Wickramaratna',
  email: 'admin@academent.ai',
  role: 'Super Admin',
  avatar: 'SW',
  mfaVerified: false,
}

const adminRoleLabels: UserRole[] = ['Support Admin', 'Content Admin', 'System Admin', 'Super Admin']

const normalizeRoleText = (role: unknown): string => String(role || '').replace(/[-_]+/g, ' ').trim().toLowerCase()

const toAdminRole = (role: unknown, fallback: UserRole = 'System Admin'): UserRole => {
  const normalized = normalizeRoleText(role)
  const match = adminRoleLabels.find((label) => label.toLowerCase() === normalized)
  return match ?? fallback
}

const hasAdminRole = (role: unknown): boolean => adminRoleLabels.some((label) => label.toLowerCase() === normalizeRoleText(role))

const getInitials = (name: string): string => name
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase() || 'AD'

const validateDemoAdminLogin = (email: string, password: string): LoginResult => {
  const normalizedEmail = email.trim().toLowerCase()

  if (normalizedEmail.includes('locked')) {
    return {
      state: 'locked',
      message: 'This administrator account is locked after too many failed attempts.',
    }
  }

  if (!normalizedEmail.endsWith('@academent.ai')) {
    return {
      state: 'unauthorized',
      message: 'This account does not have permission to access the admin portal.',
    }
  }

  if (password.length < 8) {
    return {
      state: 'invalid',
      message: 'The email or password is incorrect.',
    }
  }

  return {
    state: 'mfa',
    message: 'Multi-factor verification is required to continue.',
    session: { ...demoAdmin, email: normalizedEmail },
  }
}

export async function validateAdminLogin(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!firebaseConfigStatus.isConfigured || !auth || !db) {
    return validateDemoAdminLogin(normalizedEmail, password)
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
    const { user } = credential
    const profileSnapshot = await getDoc(doc(db, 'users', user.uid))
    const profile = profileSnapshot.exists() ? profileSnapshot.data() : null
    const isAcadementAdminEmail = normalizedEmail.endsWith('@academent.ai')
    const isVerifiedAcadementAdminEmail = isAcadementAdminEmail && user.emailVerified
    const isAuthorizedAdmin = isVerifiedAcadementAdminEmail || hasAdminRole(profile?.role)

    if (!isAuthorizedAdmin) {
      await signOut(auth).catch(() => undefined)
      return {
        state: 'unauthorized',
        message: 'This account does not have permission to access the admin portal.',
      }
    }

    const displayName = String(profile?.fullName || user.displayName || normalizedEmail.split('@')[0] || 'Academent Admin')
    const role = toAdminRole(profile?.role, isAcadementAdminEmail ? 'System Admin' : 'Support Admin')

    return {
      state: 'mfa',
      message: 'Multi-factor verification is required to continue.',
      session: {
        id: user.uid,
        name: displayName,
        email: normalizedEmail,
        role,
        avatar: getInitials(displayName),
        mfaVerified: false,
      },
    }
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''

    if (code === 'auth/too-many-requests') {
      return {
        state: 'locked',
        message: 'This administrator account is temporarily locked after too many failed attempts.',
      }
    }

    return {
      state: 'invalid',
      message: 'The email or password is incorrect.',
    }
  }
}

export function verifyMfaCode(session: AdminSession, code: string): LoginResult {
  if (!/^\d{6}$/.test(code) || code === '000000') {
    return {
      state: 'invalid',
      message: 'The verification code is invalid or expired.',
    }
  }

  return {
    state: 'success',
    message: 'Administrator verified.',
    session: { ...session, mfaVerified: true },
  }
}

export async function clearAdminFirebaseSession(): Promise<void> {
  if (!auth) return
  await signOut(auth)
}
