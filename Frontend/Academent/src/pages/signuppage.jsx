import { useState, useEffect, useRef } from 'react';
import './signuppage.css';
import logo from '../assets/Logo/Logo.png';

function SignupPage({ onSignIn, onSignupComplete }) {
  const canvasRef = useRef(null);

  // Input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // WebGL Shader Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    let animationFrameId;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    
    // Create organic movement
    float noise = sin(uv.x * 10.0 + u_time * 0.5) * 0.5 + 0.5;
    noise *= cos(uv.y * 8.0 - u_time * 0.7) * 0.5 + 0.5;
    
    // Base colors from the design system
    vec3 color1 = vec3(0.302, 0.169, 0.549); // #4D2B8C - Primary Purple
    vec3 color2 = vec3(0.522, 0.251, 0.616); // #85409D - Secondary Purple
    vec3 accent = vec3(0.933, 0.655, 0.153); // #EEA727 - Accent Amber
    
    // Dynamic gradient mix
    vec3 finalColor = mix(color1, color2, uv.y + noise * 0.3);
    finalColor = mix(finalColor, accent, noise * 0.15);
    
    // Subtle vignette
    float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - 0.5));
    finalColor *= vignette;
    
    gl_FragColor = vec4(finalColor, 1.0);
}`;

    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    function render(t) {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (password.length === 0) {
      return { score: 0, label: 'Password strength', colorClass: 'bg-outline-variant' };
    }
    let score = 1;
    if (password.length > 5) score = 2;
    if (password.length > 8 && /[0-9]/.test(password)) score = 3;
    if (password.length > 10 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password)) score = 4;

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

  // Submit Handler
  const handleMainCTA = (event) => {
    event.preventDefault();

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        if (onSignupComplete) {
          onSignupComplete(email);
        }
      }, 1000);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-stretch overflow-hidden bg-background font-body-md">
      {/* Left Branding & Illustration Section (60%) */}
      <section className="hidden lg:flex w-[60%] relative gradient-bg overflow-hidden flex-col justify-between p-xxl">
        {/* WebGL Shader Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full -z-10 opacity-30 pointer-events-none"
        />

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
        <div className="relative z-10 max-w-2xl mt-xl">
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
              className="w-full h-auto drop-shadow-2xl"
              src="https://lh3.googleusercontent.com/aida/AP1WRLvSl0MPtC06vfUDPhuQr0AwIWaQVDIZ6g_UXQmC49Q3SFb2EGFLV_Yu_uq3xdr0MYTI9a6pklGPv64NAitdMfxP4gVXdC-v057kg6NHIKTtjoItNpX4BtDLu6RSlviNYj8aEWQNSRhBXs_AM-NeD8owlPN4YCjJRDygW26bwWCDmIkqaxySJj7XhX4RbVAyHRNwWqxY5uQRfcUDOBlqgPikBD_oONEEVoSMH_83aemZXbOJ9Sxh48o5uhs"
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
          © 2024 Academent AI. Empowering students with enlightened intelligence.
        </p>
      </section>

      {/* Right Sign-up Form Section (40%) */}
      <section className="w-full lg:w-[40%] bg-surface flex flex-col items-center justify-center p-gutter md:p-xxl overflow-y-auto">
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
            <div className="space-y-xs group">
              <label className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors block">
                Full Name
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-12 bg-surface-container-low border-none rounded-2xl px-md font-body-md text-body-md input-focus"
                placeholder="John Doe"
                type="text"
              />
            </div>

            <div className="space-y-xs group">
              <label className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors block">
                Email Address
              </label>
              <input
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-surface-container-low border-none rounded-2xl px-md font-body-md text-body-md input-focus"
                placeholder="john@university.edu"
                type="email"
              />
            </div>

            <div className="space-y-xs group">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors block">
                  Password
                </label>
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="material-symbols-outlined text-on-surface-variant cursor-pointer text-[20px] select-none hover:text-primary transition-colors"
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </div>
              <input
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-surface-container-low border-none rounded-2xl px-md font-body-md text-body-md input-focus"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
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
