import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
// Lazy-load route pages so the initial app shell stays small.
const LoginPage = lazy(() => import('./pages/loginpage.jsx'))
const SignupPage = lazy(() => import('./pages/signuppage.jsx'))
const VerifyEmailPage = lazy(() => import('./pages/verifyemailpage.jsx'))
const AcademicProfilePage = lazy(() => import('./pages/academicprofilepage.jsx'))
const LearningGoalsPage = lazy(() => import('./pages/learninggoalspage.jsx'))
const FinalOnboardingPage = lazy(() => import('./pages/finalonboardingpage.jsx'))
const DashboardPage = lazy(() => import('./pages/dashboardpage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/resetpasswordpage.jsx'))
// Import ProtectedRoute component to shield authenticated-only routes
import ProtectedRoute from './routes/ProtectedRoutes.jsx'
// Import PublicRoute component to shield public-only routes
import PublicRoute from './routes/PublicRoute.jsx'
// Import Auth context to access current user email
import { useAuth } from './context/AuthContext'
// Import service logic to check Firestore onboarding status
import { logoutUser } from './Services/authService'
import LoadingEffect from './components/LoadingEffect'
import { dashboardWindowItems } from './routes/windowRoutes'
import { applyThemeMode, getStoredThemeMode, normalizeThemeMode, storeThemeMode } from './utils/theme'
import useStudyPlannerReminderProcessor from './hooks/useStudyPlannerReminderProcessor'
import { installConsoleErrorLogging, logErrorEvent, logUserActivity } from './Services/loggingService'

const getInteractionTarget = (target) => {
  if (!(target instanceof Element)) return null
  return target.closest('button, a, [role="button"], [role="menuitem"], [role="tab"], input[type="submit"]')
}

const getInteractionLabel = (element) => {
  const label = element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || element.getAttribute('href') || element.tagName
  return String(label).replace(/\s+/g, ' ').trim().slice(0, 140) || element.tagName.toLowerCase()
}


/**
 * Main application component setting up router paths and transitions.
 */
function App() {
  // Track email state across onboarding steps (needed for verifying email)
  const [email, setEmail] = useState('')
  const [academicProfileData, setAcademicProfileData] = useState(null)
  const [learningPreferencesData, setLearningPreferencesData] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, userProfile } = useAuth()
  const lastLoggedRoute = useRef('')
  useStudyPlannerReminderProcessor()

  useEffect(() => {
    installConsoleErrorLogging()

    const handleRuntimeError = (event) => {
      logErrorEvent(event.error || event.message, {
        action: 'window_error',
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        level: 'Critical',
        service: 'Runtime Error',
      })
    }

    const handleUnhandledRejection = (event) => {
      logErrorEvent(event.reason || 'Unhandled promise rejection', {
        action: 'unhandled_rejection',
        level: 'Critical',
        service: 'Promise Rejection',
      })
    }

    window.addEventListener('error', handleRuntimeError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleRuntimeError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return

    const routeKey = `${currentUser.uid}:${location.pathname}${location.search}`
    if (lastLoggedRoute.current === routeKey) return
    lastLoggedRoute.current = routeKey

    logUserActivity('Page viewed', {
      message: `Viewed ${location.pathname || '/'}`,
      pathname: location.pathname,
      search: location.search,
      service: 'Navigation',
    })
  }, [currentUser, location.pathname, location.search])

  useEffect(() => {
    if (!currentUser) return undefined

    const handleDocumentClick = (event) => {
      const element = getInteractionTarget(event.target)
      if (!element) return

      const label = getInteractionLabel(element)
      logUserActivity('Interface interaction', {
        element: element.tagName.toLowerCase(),
        href: element.getAttribute('href') || '',
        label,
        message: `Interacted with ${label}`,
        pathname: location.pathname,
        role: element.getAttribute('role') || '',
        service: 'User Interaction',
      })
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => document.removeEventListener('click', handleDocumentClick, true)
  }, [currentUser, location.pathname])

  useEffect(() => {
    const themeMode = normalizeThemeMode(userProfile?.appPreferences?.themeMode || getStoredThemeMode());
    storeThemeMode(themeMode);
    applyThemeMode(themeMode);

    if (themeMode !== 'System') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => applyThemeMode('System');

    mediaQuery.addEventListener?.('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener?.('change', handleSystemThemeChange);
  }, [userProfile?.appPreferences?.themeMode]);
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
    <Suspense fallback={<LoadingEffect variant="full" title="Loading page" message="Preparing the next study screen." />}>
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
      {/* Protected app window routes: users must be logged in */}
      {dashboardWindowItems.map((item) => (
        <Route
          key={item.id}
          path={item.route}
          element={
            <ProtectedRoute>
              <DashboardPage initialActiveTab={item.id} />
            </ProtectedRoute>
          }
        />
      ))}
      <Route
        path="/quizzes/:quizId"
        element={
          <ProtectedRoute>
            <DashboardPage initialActiveTab="quiz-generator" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flashcards/:flashcardSetId"
        element={
          <ProtectedRoute>
            <DashboardPage initialActiveTab="flashcards" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pdfs/:pdfId"
        element={
          <ProtectedRoute>
            <DashboardPage initialActiveTab="my-notes" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exams/:eventId"
        element={
          <ProtectedRoute>
            <DashboardPage initialActiveTab="study-planner" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:eventId"
        element={
          <ProtectedRoute>
            <DashboardPage initialActiveTab="study-planner" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:eventId"
        element={
          <ProtectedRoute>
            <DashboardPage initialActiveTab="study-planner" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-plans/:eventId"
        element={
          <ProtectedRoute>
            <DashboardPage initialActiveTab="study-planner" />
          </ProtectedRoute>
        }
      />
      {/* Reset Password: User to reset their password */}
      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />
      </Routes>
    </Suspense>
  )
}

export default App
