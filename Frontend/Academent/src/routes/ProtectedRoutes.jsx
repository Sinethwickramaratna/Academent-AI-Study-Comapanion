import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RedirectWithTransition from "./RedirectWithTransition";

/**
 * Route protection wrapper component.
 * - Ensures that nested children components can only be viewed if a user is authenticated.
 * - Redirects to /verify-email if user is not verified.
 * - Redirects to current onboarding step if onboarding is not completed and trying to access dashboard.
 * - Redirects to /dashboard if onboarding is completed and trying to access onboarding steps.
 */
const ProtectedRoute = ({ children }) => {
  // Retrieve the currentUser and userProfile objects from AuthContext
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();

  // If no user is authenticated, redirect them to "/login"
  if (!currentUser) {
    return <RedirectWithTransition to="/login" replace />;
  }

  // Guard: Email verification
  if (!currentUser.emailVerified) {
    return <RedirectWithTransition to="/verify-email" replace />;
  }

  const onboardingCompleted = userProfile?.onboardingCompleted;
  const isOnboardingPage = location.pathname.match(/^\/(academic-profile|learning-goals|final-onboarding)/);

  // If onboarding is NOT completed, they shouldn't access dashboard
  if (!onboardingCompleted) {
    if (!isOnboardingPage) {
      const step = userProfile?.onboardingStep;
      if (step === "learning-goals") {
        return <RedirectWithTransition to="/learning-goals" replace />;
      } else if (step === "academic-goals") {
        return <RedirectWithTransition to="/final-onboarding" replace />;
      } else {
        return <RedirectWithTransition to="/academic-profile" replace />;
      }
    }
  }

  // If onboarding IS completed, they shouldn't access onboarding pages
  if (onboardingCompleted && isOnboardingPage) {
    return <RedirectWithTransition to="/dashboard" replace />;
  }

  // Otherwise, render the child component(s)
  return children;
};

export default ProtectedRoute;