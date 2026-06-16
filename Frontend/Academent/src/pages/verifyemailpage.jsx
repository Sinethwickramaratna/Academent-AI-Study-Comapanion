import { useState, useEffect, useRef } from 'react';
import './verifyemailpage.css';
import logo from '../assets/Logo/Logo.png';

function VerifyEmailPage({ email, onBackToLogin, onVerifyComplete }) {
  const canvasRef = useRef(null);
  const inputRefs = useRef([]);

  // State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(59);

  // WebGL Shader Background (Left Sidebar)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    let animationFrameId;

    function syncSize() {
      const w = canvas.clientWidth || 600;
      const h = canvas.clientHeight || 1080;
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
    
    // Base colors matching the signup theme
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

  // Countdown timer for resend OTP code
  useEffect(() => {
    if (resendCountdown === 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Handle OTP Inputs
  const handleInputChange = (index, value) => {
    // Only accept numeric digits
    if (value !== '' && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input block
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleVerifySubmit = (event) => {
    event.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 6) return;

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      setTimeout(() => {
        if (onVerifyComplete) {
          onVerifyComplete();
        }
      }, 1000);
    }, 1500);
  };

  const handleResendClick = () => {
    if (resendCountdown > 0) return;
    // Mock resend logic
    setOtp(['', '', '', '', '', '']);
    setResendCountdown(59);
    inputRefs.current[0].focus();
  };

  return (
    <div className="min-h-screen w-full flex bg-surface text-on-surface font-body-md overflow-hidden relative">
      {/* Brand Sidebar (40%) */}
      <aside className="w-[40%] h-full fixed left-0 top-0 gradient-bg-sidebar text-white flex flex-col border-r border-outline-variant py-xl px-lg z-40 overflow-hidden">
        {/* WebGL Shader Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full -z-10 opacity-30 pointer-events-none"
        />

        {/* Abstract Background Grid Pattern */}
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

        {/* Brand Header */}
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

        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col gap-sm relative z-10">
          <div className="flex items-center gap-md p-md rounded-xl text-white font-bold bg-white/10 border-r-4 border-tertiary-fixed-dim transition-all duration-200">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              vibration
            </span>
            <span className="font-label-md text-label-md">Welcome</span>
          </div>

          <div className="flex items-center gap-md p-md rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
            <span className="material-symbols-outlined">psychology</span>
            <span className="font-label-md text-label-md">Personalization</span>
          </div>

          <div className="flex items-center gap-md p-md rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
            <span className="material-symbols-outlined">target</span>
            <span className="font-label-md text-label-md">Goals</span>
          </div>

          <div className="flex items-center gap-md p-md rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
            <span className="material-symbols-outlined">verified</span>
            <span className="font-label-md text-label-md">Complete</span>
          </div>
        </nav>

        {/* Brand Illustration Area */}
        <div className="mt-auto relative rounded-2xl overflow-hidden aspect-square w-full relative z-10 border border-white/10 shadow-xl mb-4">
          <img
            alt="AI Assistant Illustration"
            className="w-full h-full object-cover rounded-2xl"
            src="https://lh3.googleusercontent.com/aida/AP1WRLvdEogNMmrCLINH41zVgEorhMCBK1kIxFntxQb736WEzOsDoX17tdJ6o2M8tIgXNUnJOe2QSZNjPBLdyBrBkOOsWjRgCanU25_BxajSozN9EHwP58Ij9Izl3IKzsfRDPelzUEcC7GxmQCyXP3qrOCVI2AGavB0_y_AoUhlJZpb7BXjsJhzRQWBTl9rh5Ho6ei94KryltshQYIZp3KxIqgOMBUhuGh45a7dcE-iG24o5UJHT0bDN5Fym7Hw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"></div>
        </div>
      </aside>

      {/* Content Canvas (60%) */}
      <section className="ml-[40%] w-[60%] h-full flex flex-col items-center justify-center p-xxl bg-white">
        <form
          onSubmit={handleVerifySubmit}
          className="max-w-md w-full text-center space-y-xl animate-fade-in-up"
        >
          {/* Header Icon */}
          <div className="mx-auto w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-md shadow-inner">
            <span
              className="material-symbols-outlined text-primary text-4xl"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              mail
            </span>
          </div>

          <div className="space-y-sm">
            <h2 className="font-display-lg text-display-lg text-primary">Verify Your Email</h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed font-medium">
              We've sent a 6-digit code to{' '}
              <span className="font-bold text-on-surface">
                {email || 'john.doe@university.edu'}
              </span>
              . <br />
              Please enter it below to activate your account.
            </p>
          </div>

          {/* OTP Input Blocks */}
          <div className="flex justify-between gap-xs sm:gap-sm py-lg">
            {otp.map((val, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                value={val}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input w-12 h-16 sm:w-14 sm:h-20 text-center text-3xl font-bold bg-[#F9FAFB] border border-outline-variant rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                maxLength={1}
                type="text"
                pattern="\d*"
                inputMode="numeric"
              />
            ))}
          </div>

          <div className="space-y-lg">
            <button
              disabled={isVerifying || otp.join('').length < 6}
              type="submit"
              className={`w-full py-lg rounded-xl gradient-button text-white font-label-md text-label-md text-lg shadow-xl shadow-primary/10 flex items-center justify-center font-bold ${
                isVerified ? 'bg-[#e49f1d]' : ''
              }`}
            >
              {isVerifying ? (
                <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
              ) : isVerified ? (
                'Email Confirmed!'
              ) : (
                'Verify & Continue'
              )}
            </button>

            <div className="pt-md">
              <p className="font-body-md text-body-md text-on-surface-variant font-semibold">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendClick}
                  disabled={resendCountdown > 0}
                  className={`font-bold ml-xs transition-all ${
                    resendCountdown > 0
                      ? 'text-on-surface-variant/50 cursor-not-allowed'
                      : 'text-secondary hover:underline'
                  }`}
                >
                  {resendCountdown > 0 ? `Resend Code in ${resendCountdown}s` : 'Resend Code'}
                </button>
              </p>
            </div>
          </div>

          {/* Assistance footer */}
          <div className="pt-xxl border-t border-outline-variant/30 mt-xxl">
            <div className="flex items-center justify-center gap-md text-on-surface-variant opacity-75">
              <span className="material-symbols-outlined text-outline">help_outline</span>
              <span className="font-label-sm text-label-sm font-semibold">
                Need help? Contact support@academent.ai
              </span>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

export default VerifyEmailPage;
