import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RedirectWithTransition from "./RedirectWithTransition";

/**
 * Route restriction wrapper component for public-only pages (Login, Signup, Verify Email).
 * - If user is not logged in: allows access.
 * - If user is logged in but not verified: allows access only to /verify-email, redirects other routes to /verify-email.
 * - If user is logged in, verified, and onboarding is completed: redirects to /dashboard.
 * - If user is logged in, verified, but onboarding is not completed: redirects to their current onboarding step.
 */
const PublicRoute = ({ children }) => {
  // Retrieve authentication context state
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();

  // If no user is authenticated, render the public page (login/signup)
  if (!currentUser) {
    return children;
  }

  // If user is authenticated but not verified
  if (!currentUser.emailVerified) {
    if (location.pathname === "/verify-email") {
      return children;
    }
    return <RedirectWithTransition to="/verify-email" replace />;
  }

  // If verified and authenticated, redirect away from public page to their appropriate destination
  if (userProfile?.onboardingCompleted) {
    return <RedirectWithTransition to="/dashboard" replace />;
  } else {
    const step = userProfile?.onboardingStep;
    if (step === "learning-goals") {
      return <RedirectWithTransition to="/learning-goals" replace />;
    } else if (step === "academic-goals") {
      return <RedirectWithTransition to="/final-onboarding" replace />;
    } else {
      return <RedirectWithTransition to="/academic-profile" replace />;
    }
  }
};

export default PublicRoute;
