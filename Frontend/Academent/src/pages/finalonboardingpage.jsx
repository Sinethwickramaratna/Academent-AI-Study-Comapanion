import { useState, useEffect, useRef } from 'react';
import './finalonboardingpage.css';
import logo from '../assets/Logo/Logo.png';
import { getFriendlyAuthError, updateUserProfileData } from '../Services/authService';

function FinalOnboardingPage({ onBack, onComplete }) {
  const canvasRef = useRef(null);
  const leftSectionRef = useRef(null);

  // Form states
  const [selectedGoals, setSelectedGoals] = useState(['grades', 'complete']);
  const [targetGpa, setTargetGpa] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('Pass Upcoming Exams');

  // Parallax offset
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Parallax hover effect
  const handleLeftSectionMouseMove = (e) => {
    const rect = leftSectionRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = (e.clientX - rect.left - centerX) / 60;
    const deltaY = (e.clientY - rect.top - centerY) / 60;
    setParallaxOffset({ x: deltaX, y: deltaY });
  };

  // Onboarding goals metadata
  const goalsList = [
    { id: 'grades', icon: 'trending_up', label: 'Improve Grades' },
    { id: 'exams', icon: 'edit_note', label: 'Prepare for Exams' },
    { id: 'organized', icon: 'calendar_month', label: 'Stay Organized' },
    { id: 'skills', icon: 'psychology', label: 'Learn New Skills' },
    { id: 'complete', icon: 'bolt', label: 'Complete Faster' },
    { id: 'habits', icon: 'history_edu', label: 'Study Habits' },
  ];

  const toggleGoal = (goalId) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((id) => id !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    setErrorMessage('');

    try {
      await updateUserProfileData({
        academicGoals: {
          goals: selectedGoals,
          targetGpa: targetGpa.trim(),
          primaryGoal,
        },
        onboardingCompleted: true,
        onboardingStep: 'complete',
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-surface text-on-surface font-body-md overflow-x-hidden relative">
      {/* LEFT SECTION: 40% Width */}
      <section
        ref={leftSectionRef}
        onMouseMove={handleLeftSectionMouseMove}
        className="hidden lg:flex lg:w-[40%] relative flex-col justify-center items-center p-xxl text-center overflow-hidden gradient-bg"
      >
        {/* WebGL Shader Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-0 opacity-30 pointer-events-none"
        />

        {/* Decorative pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 w-full max-w-lg space-y-xl">
          <div className="transform transition-transform duration-700">
            <img
              alt="Personalized Learning Dashboard"
              className="w-full h-auto drop-shadow-2xl rounded-3xl"
              src="https://lh3.googleusercontent.com/aida/AP1WRLvvk0FIZuKdWohVfCa6TK5mz7H3I7h1PzikHzh8j1mr703WBwoytlbLoGb43WBIiDUm2ieupFbMBcRtI4uQc97bpmN2mIr-qlNY4_bEsf6zP6dIXPXI22wW-171BIBnmHMgb6_yKXj9OCgj8oPHYjPji-LgRtQrdjqwcyMi5cdrgiBDofO3nBBWDNh1uxWW3Z7TUqq4f5NAYNwO6K59AIJ3zb0TNw99YNEK19pfk5NkKYOB_aclsmm60_w"
              style={{
                transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px) scale(1.02)`,
              }}
            />
          </div>
          <div className="space-y-md text-white">
            <h1 className="font-display-lg text-display-lg leading-tight font-bold">Almost There!</h1>
            <p className="font-body-lg text-body-lg opacity-85 max-w-sm mx-auto font-medium">
              Your personalized learning experience is being crafted just for you.
            </p>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-sm z-20">
          <div className="h-1.5 w-8 bg-white/30 rounded-full" />
          <div className="h-1.5 w-8 bg-white/30 rounded-full" />
          <div className="h-1.5 w-12 bg-white rounded-full" />
        </div>
      </section>

      {/* RIGHT SECTION: 60% Width */}
      <section className="flex-1 bg-white flex flex-col relative">
        {/* HEADER */}
        <header className="fixed top-0 right-0 w-full lg:w-[60%] z-50 bg-surface-container-lowest/80 backdrop-blur-md px-margin-mobile md:px-margin-desktop lg:px-xxl flex justify-between items-center border-b border-outline-variant/10 h-32">
          <div className="flex items-center gap-xs">
            <img alt="Academent AI Logo" className="h-10 w-auto object-contain" src={logo} />
          </div>
          <div className="flex items-center gap-md">
            <div className="text-right hidden sm:block">
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Step 3 of 3
              </p>
              <p className="font-label-md text-label-md font-bold text-primary">Academic Goals</p>
            </div>
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  className="text-surface-container"
                  cx="28"
                  cy="28"
                  fill="transparent"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <circle
                  className="text-primary"
                  cx="28"
                  cy="28"
                  fill="transparent"
                  r="24"
                  stroke="currentColor"
                  strokeDasharray="150.8"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <span className="absolute text-label-sm font-bold text-primary">100%</span>
            </div>
          </div>
        </header>

        {/* MAIN FORM CONTENT (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-margin-mobile md:px-margin-desktop lg:px-xxl pb-36 pt-36">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-xxl">
            {/* Titles */}
            <div className="space-y-xs">
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold leading-tight">
                Set Your Academic Goals
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                Let's create your personalized AI learning journey.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-2xl bg-error/10 px-md py-sm text-error font-label-md text-label-md">
                {errorMessage}
              </div>
            )}

            {/* Goal Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
              {goalsList.map((goal) => {
                const isChecked = selectedGoals.includes(goal.id);
                return (
                  <label key={goal.id} className="cursor-pointer group">
                    <input
                      checked={isChecked}
                      onChange={() => toggleGoal(goal.id)}
                      className="hidden goal-card-radio"
                      type="checkbox"
                    />
                    <div
                      className={`goal-card-content flex flex-col p-lg rounded-2xl border-2 border-surface-variant bg-surface-container-lowest hover:border-primary/40 space-y-sm h-full ${
                        isChecked ? 'goal-card-active' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform text-2xl">
                        {goal.icon}
                      </span>
                      <span className="font-label-md text-label-md font-semibold">
                        {goal.label}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Input Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg pt-md">
              <div className="space-y-xs group">
                <label className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors block font-semibold">
                  Target GPA
                </label>
                <input
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl px-lg py-md focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md input-focus"
                  placeholder="e.g. 4.0"
                  type="text"
                />
              </div>

              <div className="space-y-xs group">
                <label className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors block font-semibold">
                  Primary Goal
                </label>
                <div className="relative">
                  <select
                    value={primaryGoal}
                    onChange={(e) => setPrimaryGoal(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-lg py-md focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer font-body-md input-focus font-medium"
                  >
                    <option value="Pass Upcoming Exams">Pass Upcoming Exams</option>
                    <option value="Improve Weak Subjects">Improve Weak Subjects</option>
                    <option value="Increase GPA">Increase GPA</option>
                    <option value="Complete Semester Successfully">
                      Complete Semester Successfully
                    </option>
                    <option value="Learn New Topics">Learn New Topics</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* AI Setup Status */}
            <div className="bg-surface-container-low/50 p-xl rounded-2xl space-y-lg border border-outline-variant/20">
              <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider font-semibold">
                AI Setup Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex items-center gap-sm">
                  <span
                    className="material-symbols-outlined text-on-tertiary-container text-xl"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    check_circle
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                    Personalized Study Plan
                  </span>
                </div>
                <div className="flex items-center gap-sm">
                  <span
                    className="material-symbols-outlined text-on-tertiary-container text-xl"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    check_circle
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                    AI Tutor Ready
                  </span>
                </div>
                <div className="flex items-center gap-sm">
                  <span
                    className="material-symbols-outlined text-on-tertiary-container text-xl"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    check_circle
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                    Quiz Generator Enabled
                  </span>
                </div>
                <div className="flex items-center gap-sm">
                  <span
                    className="material-symbols-outlined text-on-tertiary-container text-xl"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    check_circle
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                    Progress Tracking Activated
                  </span>
                </div>
              </div>
            </div>

            {/* FIXED BOTTOM NAVIGATION BAR */}
            <footer className="fixed bottom-0 right-0 w-full lg:w-[60%] h-24 bg-white/90 backdrop-blur-md px-margin-mobile md:px-margin-desktop lg:px-xxl flex items-center justify-between border-t border-outline-variant/10 z-50">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 px-xl py-3.5 rounded-full font-label-md text-label-md text-primary border border-primary hover:bg-primary-fixed/30 transition-all active:scale-95 font-bold"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-xl py-3.5 rounded-full font-label-md text-label-md text-white primary-gradient shadow-lg hover:shadow-primary/30 hover:opacity-90 transition-all active:scale-95 group font-bold"
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  auto_awesome
                </span>
                {isSaving ? 'Saving...' : 'Generate My Learning Dashboard'}
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </footer>
          </form>
        </div>
      </section>
    </div>
  );
}

export default FinalOnboardingPage;
