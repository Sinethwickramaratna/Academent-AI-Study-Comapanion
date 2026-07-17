import { useState, type FormEvent } from 'react'
import { validateAdminLogin, verifyMfaCode, type LoginState } from '../../services/auth'
import type { AdminSession } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { StateBlock } from '../../components/ui/StateBlock'

interface LoginPageProps {
  sessionExpired: boolean
  onAuthenticated: (session: AdminSession) => void
}

export function LoginPage({ sessionExpired, onAuthenticated }: LoginPageProps) {
  const [email, setEmail] = useState('admin@academent.ai')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [rememberDevice, setRememberDevice] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loginState, setLoginState] = useState<LoginState>('idle')
  const [message, setMessage] = useState('')
  const [pendingSession, setPendingSession] = useState<AdminSession | null>(null)

  const submitCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginState('loading')

    try {
      const result = await validateAdminLogin(email, password)

      window.setTimeout(() => {
        setLoginState(result.state)
        setMessage(result.message)
        setPendingSession(result.session ?? null)
      }, 350)
    } catch {
      setLoginState('invalid')
      setMessage('The admin portal could not complete sign-in. Please try again.')
      setPendingSession(null)
    }
  }

  const submitMfa = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!pendingSession) {
      return
    }

    setLoginState('loading')
    const result = verifyMfaCode(pendingSession, mfaCode)

    window.setTimeout(() => {
      setLoginState(result.state)
      setMessage(result.message)

      if (result.session) {
        onAuthenticated(result.session)
      }
    }, 350)
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="brand-mark large">A</div>
          <div>
            <span>Academent</span>
            <h1>Admin Portal</h1>
          </div>
        </div>

        {sessionExpired ? (
          <StateBlock
            type="expired"
            title="Session expired"
            message="Your administrator session ended. Verify again before continuing."
          />
        ) : null}

        {loginState === 'mfa' && pendingSession ? (
          <form className="auth-form" onSubmit={submitMfa}>
            <div className="form-heading">
              <Icon name="key" />
              <div>
                <h2>Multi-factor authentication</h2>
                <p>Enter the 6-digit code from your authenticator app.</p>
              </div>
            </div>
            <label>
              Verification code
              <input
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                onChange={(event) => setMfaCode(event.target.value)}
                placeholder="123456"
                required
                value={mfaCode}
              />
            </label>
            {message ? <p className="form-message">{message}</p> : null}
            <Button icon="shield" variant="primary" type="submit">Verify administrator</Button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitCredentials}>
            <div className="form-heading">
              <Icon name="lock" />
              <div>
                <h2>Secure administrator login</h2>
                <p>Restricted to authorized Academent administrators.</p>
              </div>
            </div>
            <label>
              Email address
              <input
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@academent.ai"
                required
                type="email"
                value={email}
              />
            </label>
            <label>
              Password
              <span className="password-field">
                <input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label="Show or hide password">
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} />
                </button>
              </span>
            </label>
            <div className="form-row">
              <label className="checkbox-row">
                <input checked={rememberDevice} onChange={(event) => setRememberDevice(event.target.checked)} type="checkbox" />
                Remember device
              </label>
              <a href="#forgot-password">Forgot password?</a>
            </div>
            {message && loginState !== 'idle' ? <p className={`form-message message-${loginState}`}>{message}</p> : null}
            <Button icon="shield" variant="primary" type="submit" disabled={loginState === 'loading'}>
              {loginState === 'loading' ? 'Checking access' : 'Continue securely'}
            </Button>
          </form>
        )}
      </section>

      <aside className="login-security">
        <h2>Security states covered</h2>
        <div className="security-state-grid">
          <span>Loading</span>
          <span>Invalid credentials</span>
          <span>Locked account</span>
          <span>Unauthorized role</span>
          <span>MFA required</span>
          <span>Session expired</span>
        </div>
        <div className="security-warning">
          <Icon name="alert" />
          <p>All administrator activity is logged with IP address, target, previous value, new value, and reason.</p>
        </div>
      </aside>
    </main>
  )
}
