import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './resetpasswordpage.css';
import logo from '../assets/Logo/Logo.png';
import screenImage from '../assets/Images/screen.png';
import { getFriendlyAuthError, resetPassword } from '../Services/authService';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Parallax styling for the floating illustration
  const [parallaxStyle, setParallaxStyle] = useState({});

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Calculate parallax offsets
    const xAxis = -x / 45;
    const yAxis = -y / 45;

    setParallaxStyle({
      transform: `translate(${xAxis}px, ${yAxis}px) rotateY(${xAxis / 2}deg) rotateX(${-yAxis / 2}deg)`,
      transition: 'none'
    });
  };

  const handleMouseLeave = () => {
    setParallaxStyle({
      transform: 'translate(0px, 0px) rotateY(0deg) rotateX(0deg)',
      transition: 'transform 0.5s ease'
    });
  };

  const handleBackToLogin = () => {
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => {
        navigate('/login');
      });
    } else {
      navigate('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('submitting');
    setErrorMessage('');
    const startTime = Date.now();

    try {
      await resetPassword(email);
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1500 - elapsed, 0);

      setTimeout(() => {
        setStatus('success');
      }, remaining);
    } catch (err) {
      setStatus('error');
      setErrorMessage(getFriendlyAuthError(err));
    }
  };

  return (
    <div className="min-h-screen w-full flex items-stretch overflow-hidden bg-background font-body-md animate-fade-in">
      {/* Left branding and illustration panel (60%) */}
      <section
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="hidden md:flex md:w-3/5 relative overflow-hidden flex-col justify-between p-xxl bg-gradient-to-tr from-[#4d2b8c] to-[#85409d]"
      >
        {/* Abstract Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="40" id="reset-grid" patternUnits="userSpaceOnUse" width="40">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect fill="url(#reset-grid)" height="100%" width="100%" />
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

        {/* Main copy and floating image */}
        <div className="relative z-10 max-w-xl my-auto">
          <h1 className="font-display-lg text-display-lg text-white mb-lg leading-tight">
            Regain Access to<br />
            <span className="text-tertiary-fixed-dim">Your Academy</span>
          </h1>
          <p className="text-white/80 font-body-lg mb-xxl max-w-md">
            Enter your registered email to reset your account security configurations and recover your personalized dashboard.
          </p>

          <div className="relative flex justify-center">
            <div
              style={parallaxStyle}
              className="relative rounded-2xl overflow-hidden aspect-[4/3] w-4/5 z-10 border border-white/10 shadow-2xl floating-anim"
            >
              <img
                alt="Reset Password Illustration"
                className="w-full h-full object-cover rounded-2xl"
                src={screenImage}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="relative z-10 text-white/50 font-label-sm text-label-sm">
          © {new Date().getFullYear()} Academent AI. All rights reserved.
        </p>
      </section>

      {/* Right reset password form panel (40%) */}
      <section className="w-full md:w-2/5 bg-surface flex flex-col items-center justify-center p-gutter md:p-xxl overflow-y-auto">
        <div className="md:hidden flex items-center gap-3 mb-xl">
          <img alt="Academent AI Logo" className="h-8 w-8 object-contain" src={logo} />
          <span className="font-headline-md text-headline-md font-extrabold text-primary">
            Academent AI
          </span>
        </div>

        <div className="w-full max-w-[420px] animate-fade-in-up">
          <div className="mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
              Reset password
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Please enter your registered email address below to receive a password reset link.
            </p>
          </div>

          <form id="resetForm" onSubmit={handleSubmit} className="space-y-lg">
            <div className="space-y-xs group">
              <label htmlFor="resetEmail" className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors block font-semibold">
                Email Address
              </label>
              <input
                id="resetEmail"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-surface-container-low border-none rounded-2xl px-md font-body-md text-body-md input-focus"
                placeholder="john@university.edu"
                type="email"
              />
            </div>

            {errorMessage && (
              <div className="rounded-2xl bg-error/10 px-md py-sm text-error font-label-md text-label-md">
                {errorMessage}
              </div>
            )}

            <button
              disabled={status === 'submitting' || status === 'success'}
              type="submit"
              style={status === 'success' ? { background: '#4CAF50' } : {}}
              className={`w-full h-14 text-white rounded-3xl font-headline-md text-headline-md shadow-lg flex items-center justify-center gap-2 transition-all ${
                status === 'success' ? 'bg-[#4CAF50]' : 'btn-gradient'
              }`}
            >
              {status === 'submitting' ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending Link...</span>
                </>
              ) : status === 'success' ? (
                <>
                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                  <span>Link Sent Successfully</span>
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <p className="mt-xl text-center font-body-md text-body-md text-on-surface-variant font-medium">
            Remember your password?{' '}
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-primary font-bold hover:underline"
            >
              Back to Login
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}

export default ResetPasswordPage;