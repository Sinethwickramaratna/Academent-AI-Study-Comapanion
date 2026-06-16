import { useState } from 'react'
import LoginPage from './pages/loginpage.jsx'
import SignupPage from './pages/signuppage.jsx'
import VerifyEmailPage from './pages/verifyemailpage.jsx'
import AcademicProfilePage from './pages/academicprofilepage.jsx'

function App() {
  const [screen, setScreen] = useState('login')
  const [email, setEmail] = useState('')

  const transitionToScreen = (nextScreen) => {
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => {
        setScreen(nextScreen)
      })
      return
    }

    setScreen(nextScreen)
  }

  if (screen === 'login') {
    return <LoginPage onCreateAccount={() => transitionToScreen('signup')} />
  }

  if (screen === 'signup') {
    return (
      <SignupPage
        onSignIn={() => transitionToScreen('login')}
        onSignupComplete={(userEmail) => {
          setEmail(userEmail)
          transitionToScreen('verify-email')
        }}
      />
    )
  }

  if (screen === 'verify-email') {
    return (
      <VerifyEmailPage
        email={email}
        onBackToLogin={() => transitionToScreen('login')}
        onVerifyComplete={() => transitionToScreen('academic-profile')}
      />
    )
  }

  if (screen === 'academic-profile') {
    return (
      <AcademicProfilePage
        onBack={() => transitionToScreen('verify-email')}
        onComplete={() => {
          transitionToScreen('login')
        }}
      />
    )
  }

  return null
}

export default App
