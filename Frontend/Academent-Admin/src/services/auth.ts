import type { AdminSession } from '../types/admin'

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

export function validateAdminLogin(email: string, password: string): LoginResult {
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
