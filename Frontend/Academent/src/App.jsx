import { useState } from 'react'
import LoginPage from './pages/loginpage.jsx'
import SignupPage from './pages/signuppage.jsx'

function App() {
  const [screen, setScreen] = useState('login')

  const transitionToScreen = (nextScreen) => {
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => {
        setScreen(nextScreen)
      })
      return
    }

    setScreen(nextScreen)
  }

  return screen === 'login' ? (
    <LoginPage onCreateAccount={() => transitionToScreen('signup')} />
  ) : (
    <SignupPage onSignIn={() => transitionToScreen('login')} />
  )
}

export default App
