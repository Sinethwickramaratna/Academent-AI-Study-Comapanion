import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
// Import the onboarding, dashboard and authentication pages
import LoginPage from './pages/loginpage.jsx'
import SignupPage from './pages/signuppage.jsx'
import VerifyEmailPage from './pages/verifyemailpage.jsx'
import AcademicProfilePage from './pages/academicprofilepage.jsx'
import LearningGoalsPage from './pages/learninggoalspage.jsx'
import FinalOnboardingPage from './pages/finalonboardingpage.jsx'
import DashboardPage from './pages/dashboardpage.jsx'
import ResetPasswordPage from './pages/resetpasswordpage.jsx'
// Import ProtectedRoute component to shield authenticated-only routes
import ProtectedRoute from './routes/ProtectedRoutes.jsx'
// Import PublicRoute component to shield public-only routes
import PublicRoute from './routes/PublicRoute.jsx'
// Import Auth context to access current user email
import { useAuth } from './context/AuthContext'
// Import service logic to check Firestore onboarding status
import { logoutUser } from './Services/authService'


/**
 * Main application component setting up router paths and transitions.
 */
function App() {
  // Track email state across onboarding steps (needed for verifying email)
  const [email, setEmail] = useState('')
  const [academicProfileData, setAcademicProfileData] = useState(null)
  const [learningPreferencesData, setLearningPreferencesData] = useState(null)
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  /**
   * Performs client-side navigation.
   * Leverages the Document Transition API (document.startViewTransition) if supported by the browser
   * to provide smooth layout transitions between page screens.
   * 
   * @param {string} nextScreen - The path route to navigate to.
   */
  const transitionToScreen = (nextScreen) => {
    if (typeof document.startViewTransition === 'function') {
      const transition = document.startViewTransition(() => {
        navigate(nextScreen)
      })
      // Catch skip/abort rejections to prevent console error logs
      transition.ready.catch(() => {})
      transition.updateCallbackDone.catch(() => {})
      transition.finished.catch(() => {})
      return
    }

    navigate(nextScreen)
  }

  /**
   * Handles post-authentication redirection logic (for both Signup & Login).
   * 
   * @param {object} user - The authenticated Firebase user object.
   */
  const handleAuthSuccess = (user) => {
    setEmail(user.email)
    if (user && !user.emailVerified) {
      transitionToScreen('/verify-email')
    }
  }

  return (
    <Routes>
      {/* Root path displays the Login Page */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginPage
              onCreateAccount={() => transitionToScreen('/signup')}
              onLoginSuccess={handleAuthSuccess}
            />
          </PublicRoute>
        }
      />
      {/* Explicit Login Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage
              onCreateAccount={() => transitionToScreen('/signup')}
              onLoginSuccess={handleAuthSuccess}
            />
          </PublicRoute>
        }
      />
      {/* Signup Route */}
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage
              onSignIn={() => transitionToScreen('/login')}
              onSignupComplete={handleAuthSuccess}
            />
          </PublicRoute>
        }
      />
      {/* Email Verification Pending Route */}
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <VerifyEmailPage
              email={email || currentUser?.email}
              onBackToLogin={async () => {
                try {
                  await logoutUser()
                } catch (err) {
                  console.error("Error signing out on back to login:", err)
                }
                transitionToScreen('/login')
              }}
              onVerifyComplete={async () => {
                try {
                  await logoutUser()
                } catch (err) {
                  console.error("Error signing out after email verification:", err)
                }
                transitionToScreen('/login')
              }}
            />
          </PublicRoute>
        }
      />
      {/* Protected Academic Profile Route: Users must be logged in */}
      <Route
        path="/academic-profile"
        element={
          <ProtectedRoute>
            <AcademicProfilePage
              initialData={academicProfileData}
              onBack={async () => {
                try {
                  await logoutUser()
                } catch (err) {
                  console.error("Error signing out on back from profile onboarding:", err)
                }
                transitionToScreen('/login')
              }}
              onComplete={(data) => {
                setAcademicProfileData(data)
                transitionToScreen('/learning-goals')
              }}
            />
          </ProtectedRoute>
        }
      />
      {/* Protected Learning Goals Route: Users must be logged in */}
      <Route
        path="/learning-goals"
        element={
          <ProtectedRoute>
            <LearningGoalsPage
              initialData={learningPreferencesData}
              onBack={() => transitionToScreen('/academic-profile')}
              onComplete={(data) => {
                setLearningPreferencesData(data)
                transitionToScreen('/final-onboarding')
              }}
            />
          </ProtectedRoute>
        }
      />
      {/* Protected Final Onboarding/Academic Goals Route: Users must be logged in */}
      <Route
        path="/final-onboarding"
        element={
          <ProtectedRoute>
            <FinalOnboardingPage
              academicProfileData={academicProfileData}
              learningPreferencesData={learningPreferencesData}
              onBack={() => transitionToScreen('/learning-goals')}
              onComplete={() => {
                transitionToScreen('/dashboard') // Redirect directly to dashboard when completed onboarding
              }}
            />
          </ProtectedRoute>
        }
      />
      {/* Protected Dashboard Route: Users must be logged in */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Reset Password: User to reset their password */}
      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />
    </Routes>
  )
}

export default App


