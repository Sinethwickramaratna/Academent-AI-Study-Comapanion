import { useState } from 'react';
import './signuppage.css';
import logo from '../assets/Logo/Logo.png';
import { getFriendlyAuthError, registerUser, signInWithGoogle } from '../Services/authService';
import { useAuth } from '../context/AuthContext';
import WebGLBackground from '../components/WebGLBackground';
import FormInput from '../components/FormInput';

/**
 * SignupPage handles user registration via email/password or Google OAuth.
 * Displays a custom animated WebGL shader sidebar and a password strength indicator.
 * 
 * @param {function} onSignIn - Callback to redirect to login.
 * @param {function} onSignupComplete - Callback on successful sign up registration.
 */
function SignupPage({ onSignIn, onSignupComplete }) {
  const { handleManualSignIn } = useAuth();

  // Input states for form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Evaluates the complexity and length of the password.
   * Returns a score, label description, and style color class.
   * 
   * @returns {object} { score, label, colorClass }
   */
  const getPasswordStrength = () => {
    if (password.length === 0) {
      return { score: 0, label: 'Password strength', colorClass: 'bg-outline-variant' };
    }
    let score = 1;
    if (password.length > 5) score = 2; // minimum length
    if (password.length > 8 && /[0-9]/.test(password)) score = 3; // has digit
    if (password.length > 10 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password)) score = 4; // complex characters

    let label = 'Weak password';
    let colorClass = 'bg-error';
    if (score === 2) {
      label = 'Fair password';
      colorClass = 'bg-tertiary';
    } else if (score === 3) {
      label = 'Good password';
      colorClass = 'bg-secondary';
    } else if (score === 4) {
      label = 'Strong password';
      colorClass = 'bg-primary';
    }

    return { score, label, colorClass };
  };

  const { score, label, colorClass } = getPasswordStrength();

  /**
   * Main submit handler for creating a new user with Email and Password.
   */
  const handleMainCTA = async (event) => {
    event.preventDefault();

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // Call authentication service to register the user
      const user = await registerUser(fullName, email, password);
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        if (onSignupComplete) {
          onSignupComplete(user);
        }
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      setIsSubmitted(false);
      setErrorMessage(getFriendlyAuthError(error));
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { user, isNewUser } = await signInWithGoogle(true);
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(async () => {
        if (onSignIn) {
          onSignIn(); // Redirect user to the login page directly
        }
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      setIsSubmitted(false);
      setErrorMessage(getFriendlyAuthError(error));
    }
  };


  return (
    <div className="min-h-screen w-full flex items-stretch overflow-hidden bg-background font-body-md">
      {/* Left Branding & Illustration Section (50%) */}
      <section className="hidden lg:flex w-[50%] relative gradient-bg overflow-hidden flex-col justify-between p-xxl">
        {/* WebGL Shader Background */}
        <WebGLBackground opacity={0.3} />

        {/* Abstract Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect fill="url(#grid)" height="100%" width="100%" />
          </svg>
        </div>

        {/* Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            alt="Academent AI Logo"
            className="h-10 w-10 bg-white rounded-lg p-2 object-contain"
            src={logo}
          />
          <span className="font-headline-md text-headline-md font-extrabold text-white">
            Academent AI
          </span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-2xl mt-xl mb-[10px]">
          <h1 className="font-display-lg text-display-lg text-white mb-lg leading-tight">
            Start Learning<br />
            <span className="text-tertiary-fixed-dim">Smarter Today</span>
          </h1>
          <ul className="space-y-md mb-xxl">
            <li className="flex items-center gap-3 text-white/90 font-body-lg text-body-lg">
              <span
                className="material-symbols-outlined text-tertiary-fixed-dim"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                check_circle
              </span>
              Personalized AI tutoring for every subject
            </li>
            <li className="flex items-center gap-3 text-white/90 font-body-lg text-body-lg">
              <span
                className="material-symbols-outlined text-tertiary-fixed-dim"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                check_circle
              </span>
              Automated quiz generation from study notes
            </li>
            <li className="flex items-center gap-3 text-white/90 font-body-lg text-body-lg">
              <span
                className="material-symbols-outlined text-tertiary-fixed-dim"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                check_circle
              </span>
              Smart study plans that adapt to your progress
            </li>
          </ul>

          {/* Illustration Area */}
          <div className="relative mt-xxl">
            <img
              alt="AI Learning Hub Illustration"
              className="w-4/5 h-auto drop-shadow-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkj33h6D2g47USm3BTh4VzuA111iK4ACG3usigVIwfGLHfi2xWsvi0AkXcOe7znjwiKzu_Xk8js_8wkQ8aM8i9-dUKfIu0hGXitlPPL6tTfQC4dSGY1aYEzCTx_KlDf8S_b-0EI3Qza29GnuHmJpgh88GCoG3C064oGNeHDeTACwvlw_XYeG9TGSYI1h9QgKoOao2JF8PXux-EFi9P59f2b2YIM_nQdfO4Hq1RxV_mqaRjAQp8geKAEEMORW5lMpGTHfbstJPSCxo"
            />
            {/* Floating Cards */}
            <div
              className="absolute -top-10 -right-4 glass-card p-md rounded-2xl shadow-xl floating-card animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-lg flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    chat
                  </span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">AI Chat</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    Explain Quantum Physics...
                  </p>
                </div>
              </div>
            </div>

            <div
              className="absolute top-1/2 -left-12 glass-card p-md rounded-2xl shadow-xl floating-card animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-tertiary/20 p-2 rounded-lg flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-tertiary"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    quiz
                  </span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">
                    Quiz Generation
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    10 questions ready
                  </p>
                </div>
              </div>
            </div>

            <div
              className="absolute bottom-10 right-20 glass-card p-md rounded-2xl shadow-xl floating-card animate-fade-in-up"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-secondary/20 p-2 rounded-lg flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-secondary"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    event_note
                  </span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">Study Plan</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    Optimal path found
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="relative z-10 text-white/60 font-label-sm text-label-sm">
          © {new Date().getFullYear()} Academent AI. Empowering students with enlightened intelligence.
        </p>
      </section>

      {/* Right Sign-up Form Section (40%) */}
      <section className="w-full lg:w-[50%] bg-surface flex flex-col items-center justify-center p-gutter md:p-xxl overflow-y-auto">
        <div className="lg:hidden flex items-center gap-3 mb-xl">
          <img alt="Academent AI Logo" className="h-8 w-8 object-contain" src={logo} />
          <span className="font-headline-md text-headline-md font-extrabold text-primary">
            Academent AI
          </span>
        </div>

        <form onSubmit={handleMainCTA} className="w-full max-w-[500px] animate-fade-in-up">
          <div className="mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
              Create your account
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Join 50,000+ students learning with AI.
            </p>
          </div>

          <div className="space-y-lg">
            {/* Account Details */}
            <FormInput
              id="fullName"
              name="fullName"
              label="Full Name"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 bg-surface-container-low rounded-2xl"
              placeholder="John Doe"
            />

            <FormInput
              id="email"
              name="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-surface-container-low rounded-2xl"
              placeholder="john@university.edu"
            />

            <div className="space-y-xs group">
              <FormInput
                id="password"
                name="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-surface-container-low rounded-2xl"
                placeholder="••••••••"
              />

              {/* Password Strength */}
              <div className="flex gap-1 mt-xs">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full strength-bar ${
                      i <= score ? colorClass : 'bg-outline-variant'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[12px] text-on-surface-variant mt-xs">{label}</p>
            </div>
          </div>

          <div className="mt-xl space-y-md">
            {errorMessage && (
              <div className="rounded-2xl bg-error/10 px-md py-sm text-error font-label-md text-label-md">
                {errorMessage}
              </div>
            )}

            <button
              disabled={isSubmitting}
              type="submit"
              className={`w-full h-14 text-white rounded-3xl font-headline-md text-headline-md shadow-lg flex items-center justify-center transition-all ${
                isSubmitted ? 'bg-[#e49f1d]' : 'btn-primary-gradient'
              }`}
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
              ) : isSubmitted ? (
                'Account Created! Welcome'
              ) : (
                'Continue'
              )}
            </button>

            <button
              onClick={handleGoogleSignup}
              type="button"
              disabled={isSubmitting || isSubmitted}
              className="w-full h-14 bg-white border border-outline-variant rounded-3xl font-label-md text-label-md text-on-surface flex items-center justify-center gap-3 hover:bg-surface-container-low transition-all btn-social disabled:opacity-50"
            >
              <img
                alt="Google Logo"
                className="h-6 w-6"
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
              />
              Continue with Google
            </button>
          </div>

          <p className="mt-xl text-center font-body-md text-body-md text-on-surface-variant font-medium">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSignIn}
              className="text-primary font-bold hover:underline"
            >
              Sign In
            </button>
          </p>

          <div className="mt-xxl pt-lg border-t border-outline-variant/20 flex justify-center gap-xl text-on-surface-variant opacity-60">
            <a className="font-label-sm text-label-sm hover:text-primary font-medium" href="#">
              Privacy Policy
            </a>
            <a className="font-label-sm text-label-sm hover:text-primary font-medium" href="#">
              Terms of Service
            </a>
          </div>
        </form>
      </section>
    </div>
  );
}

export default SignupPage;
