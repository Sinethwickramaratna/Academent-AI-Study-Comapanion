import { useEffect, useRef, useState } from 'react';
import './verifyemailpage.css';
import logo from '../assets/Logo/Logo.png';
import {
  getFriendlyAuthError,
  refreshEmailVerificationStatus,
  resendEmailVerification,
} from '../Services/authService';
import { auth } from '../firebase/firebase';

/**
 * VerifyEmailPage component checks if the user has verified their email address.
 * It features a WebGL animated sidebar and countdown timing for resending verification mails.
 * 
 * @param {string} email - The user's email address to verify.
 * @param {function} onBackToLogin - Callback to navigate back to the login page.
 * @param {function} onVerifyComplete - Callback to proceed when verification succeeds.
 */
function VerifyEmailPage({ email, onBackToLogin, onVerifyComplete }) {
  // Reference to the sidebar background WebGL canvas
  const canvasRef = useRef(null);
  // UI states for loading states and countdowns
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // WebGL Shader Animation Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Retrieve WebGL context
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    let animationFrameId;

    // Synchronizes the canvas drawing buffer with its CSS layout dimensions
    function syncSize() {
      const w = canvas.clientWidth || 600;
      const h = canvas.clientHeight || 1080;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    // Use ResizeObserver if available to react to container resizing
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    // Vertex shader source (simply passes coordinates through)
    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    // Fragment shader source (renders a moving organic color noise gradient in real-time)
    const fs = `precision highp float;
uniform float u_time;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    float noise = sin(uv.x * 10.0 + u_time * 0.5) * 0.5 + 0.5;
    noise *= cos(uv.y * 8.0 - u_time * 0.7) * 0.5 + 0.5;
    vec3 color1 = vec3(0.302, 0.169, 0.549);
    vec3 color2 = vec3(0.522, 0.251, 0.616);
    vec3 accent = vec3(0.933, 0.655, 0.153);
    vec3 finalColor = mix(color1, color2, uv.y + noise * 0.3);
    finalColor = mix(finalColor, accent, noise * 0.15);
    gl_FragColor = vec4(finalColor, 1.0);
}`;

    // Compiles a single shader type from GLSL source code
    function createShader(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    }

    // Link Vertex and Fragment shaders into a single WebGL program
    const prog = gl.createProgram();
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Setup rendering vertex buffer (quad covers entire screen/viewport)
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    // Map vertex attributes to shader variables
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // Get reference to u_time uniform
    const uTime = gl.getUniformLocation(prog, 'u_time');

    // WebGL animation render loop
    function render(t) {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001); // Pass time parameter as seconds
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    // Cleanup WebGL and observers on component unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  // Manage resend verification countdown timer
  useEffect(() => {
    if (resendCountdown === 0) return undefined;

    const timer = setInterval(() => {
      setResendCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Automatic polling to check email verification status in real-time
  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const checkVerificationAuto = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        await user.reload();
        if (user.emailVerified && isMounted) {
          clearInterval(intervalId);
          setIsVerified(true);
          setMessage('Email verified successfully! Redirecting...');
          
          // Sync changes to Firestore
          await refreshEmailVerificationStatus();
          
          setTimeout(() => {
            if (isMounted && onVerifyComplete) {
              onVerifyComplete();
            }
          }, 1500);
        }
      } catch (error) {
        console.error("Auto email verification check error:", error);
      }
    };

    // Check every 3 seconds
    intervalId = setInterval(checkVerificationAuto, 3000);
    checkVerificationAuto(); // Also trigger check immediately on mount

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [onVerifyComplete]);

  /**
   * Triggers a new email verification link to be sent out.
   */
  const handleResendClick = async () => {
    if (resendCountdown > 0 || isResending) return;

    setIsResending(true);
    setMessage('');
    setErrorMessage('');

    try {
      await resendEmailVerification();
      setMessage('Verification email sent again.');
      setResendCountdown(30); // Reset countdown timer
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error));
    } finally {
      setIsResending(false);
    }
  };


  return (
    <div className="min-h-screen w-full flex bg-surface text-on-surface font-body-md overflow-hidden relative">
      <aside className="hidden lg:flex w-[40%] h-full fixed left-0 top-0 gradient-bg-sidebar text-white flex-col border-r border-outline-variant py-xl px-lg z-40 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full -z-10 opacity-30 pointer-events-none"
        />

        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="verify-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#verify-grid)" />
          </svg>
        </div>

        <div className="flex items-center gap-md mb-xxl relative z-10">
          <img
            alt="Academent AI Logo"
            className="h-10 w-10 bg-white rounded-lg p-2 object-contain"
            src={logo}
          />
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-white leading-tight">
              Academent AI
            </h1>
            <p className="font-label-md text-label-md text-white/70 font-medium">
              Enlightened Intelligence
            </p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-sm relative z-10">
          <div className="flex items-center gap-md p-md rounded-xl text-white font-bold bg-white/10 border-r-4 border-tertiary-fixed-dim">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              mail
            </span>
            <span className="font-label-md text-label-md">Verify Email</span>
          </div>

          <div className="flex items-center gap-md p-md rounded-xl text-white/70">
            <span className="material-symbols-outlined">psychology</span>
            <span className="font-label-md text-label-md">Personalization</span>
          </div>

          <div className="flex items-center gap-md p-md rounded-xl text-white/70">
            <span className="material-symbols-outlined">target</span>
            <span className="font-label-md text-label-md">Goals</span>
          </div>
        </nav>

        <div className="mt-auto relative rounded-2xl overflow-hidden aspect-square w-full z-10 border border-white/10 shadow-xl mb-4">
          <img
            alt="AI Assistant Illustration"
            className="w-full h-full object-cover rounded-2xl"
            src="https://lh3.googleusercontent.com/aida/AP1WRLvdEogNMmrCLINH41zVgEorhMCBK1kIxFntxQb736WEzOsDoX17tdJ6o2M8tIgXNUnJOe2QSZNjPBLdyBrBkOOsWjRgCanU25_BxajSozN9EHwP58Ij9Izl3IKzsfRDPelzUEcC7GxmQCyXP3qrOCVI2AGavB0_y_AoUhlJZpb7BXjsJhzRQWBTl9rh5Ho6ei94KryltshQYIZp3KxIqgOMBUhuGh45a7dcE-iG24o5UJHT0bDN5Fym7Hw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"></div>
        </div>
      </aside>

      <section className="w-full lg:ml-[40%] lg:w-[60%] min-h-screen flex flex-col items-center justify-center p-gutter md:p-xxl bg-white">
        <div className="max-w-md w-full text-center space-y-xl animate-fade-in-up">
          <div className="mx-auto w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-md shadow-inner">
            <span
              className="material-symbols-outlined text-primary text-4xl"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              mark_email_read
            </span>
          </div>

          <div className="space-y-sm">
            <h2 className="font-display-lg text-display-lg text-primary">Check Your Email</h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed font-medium">
              We sent Firebase's verification link to{' '}
              <span className="font-bold text-on-surface">
                {email || 'your email address'}
              </span>
              . Open that link, then come back here to continue.
            </p>
          </div>

          {(message || errorMessage) && (
            <div
              className={`rounded-2xl px-md py-sm font-label-md text-label-md ${
                errorMessage ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
              }`}
            >
              {errorMessage || message}
            </div>
          )}

          <div className="space-y-md">
            <div className="w-full py-lg rounded-xl bg-surface-container-low text-primary font-label-md text-label-md flex items-center justify-center gap-2 font-bold shadow-inner border border-outline-variant/30">
              {isVerified ? (
                <>
                  <span className="material-symbols-outlined text-[#34A853] animate-pulse">check_circle</span>
                  <span className="text-[#34A853]">Email Verified! Redirecting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  <span>Waiting for verification...</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleResendClick}
              disabled={resendCountdown > 0 || isResending}
              className="w-full py-md rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md font-bold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isResending
                ? 'Sending...'
                : resendCountdown > 0
                  ? `Resend Email in ${resendCountdown}s`
                  : 'Resend Verification Email'}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="text-primary font-label-md text-label-md font-bold hover:underline"
            >
              Back to Sign In
            </button>
          </div>

          <div className="pt-xxl border-t border-outline-variant/30 mt-xxl">
            <div className="flex items-center justify-center gap-md text-on-surface-variant opacity-75">
              <span className="material-symbols-outlined text-outline">help_outline</span>
              <span className="font-label-sm text-label-sm font-semibold">
                Need help? Contact support@academent.ai
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default VerifyEmailPage;
