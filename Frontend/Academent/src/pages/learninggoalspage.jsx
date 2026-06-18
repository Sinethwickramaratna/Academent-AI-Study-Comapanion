import { useState, useEffect, useRef } from 'react';
import './learninggoalspage.css';
import logo from '../assets/Logo/Logo.png';
import { getFriendlyAuthError } from '../Services/authService';

/**
 * LearningGoalsPage captures the user's preferred study style, goal set,
 * and weekly commitment hours. Features WebGL and parallax decoration.
 * 
 * @param {function} onBack - Navigation back request callback.
 * @param {function} onComplete - Proceeding navigation request callback on completion.
 */
function LearningGoalsPage({ onBack, onComplete, initialData }) {
  const canvasRef = useRef(null);
  const leftSectionRef = useRef(null);

  // Form input field state hooks
  const [selectedGoals, setSelectedGoals] = useState(initialData?.learningGoals || ['explain']);
  const [studyStyle, setStudyStyle] = useState(initialData?.studyStyle || 'visual');
  const [weeklyHours, setWeeklyHours] = useState(initialData?.weeklyHours || '5-10');

  // Parallax decoration offset state
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // WebGL Shader Background (Left Sidebar illustration)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    let animationFrameId;

    // Adjust internal canvas viewport drawing resolution
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

    // Standard pass-through vertex attributes
    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    // Fluid purple-accented WebGL procedural gradient
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    
    // Create organic movement noise calculations
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

  /**
   * Parallax image hover shift calculations.
   * Modifies coordinate offset depending on cursor position.
   */
  const handleLeftSectionMouseMove = (e) => {
    const rect = leftSectionRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = (e.clientX - rect.left - centerX) / 40;
    const deltaY = (e.clientY - rect.top - centerY) / 40;
    setParallaxOffset({ x: deltaX, y: deltaY });
  };

  // Onboarding goals metadata lists
  const learningGoalsList = [
    { id: 'explain', icon: 'psychology', text: 'Explain difficult concepts' },
    { id: 'quizzes', icon: 'quiz', text: 'Generate quizzes from notes' },
    { id: 'flashcards', icon: 'style', text: 'Create flashcards' },
    { id: 'summarize', icon: 'summarize', text: 'Summarize study materials' },
    { id: 'schedules', icon: 'calendar_month', text: 'Build study schedules' },
    { id: 'exams', icon: 'assignment_turned_in', text: 'Prepare for exams' },
    { id: 'progress', icon: 'monitoring', text: 'Track academic progress' },
    { id: 'assistance', icon: 'edit_note', text: 'Assignment assistance' },
    { id: 'tutor', icon: 'smart_toy', text: 'AI Tutor support' },
  ];

  // Available learning style options
  const studyStylesList = [
    { id: 'visual', label: 'Visual Learner' },
    { id: 'reading', label: 'Reading & Writing' },
    { id: 'practice', label: 'Practice-Based Learning' },
    { id: 'interactive', label: 'Interactive Learning' },
  ];

  /**
   * Toggles selection of specific goals from the goals grid array.
   */
  const toggleGoal = (goalId) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((id) => id !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  /**
   * Handles profile update submittal and routes transition.
   */
  const handleContinue = (e) => {
    e.preventDefault();
    
    const data = {
      learningGoals: selectedGoals,
      studyStyle,
      weeklyHours,
    };

    if (onComplete) {
      onComplete(data);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-surface text-on-surface font-body-md selection:bg-primary-fixed relative">
      {/* LEFT SECTION: Visual (40% width) */}
      <section
        ref={leftSectionRef}
        onMouseMove={handleLeftSectionMouseMove}
        className="hidden md:flex md:w-[40%] relative flex-col justify-center items-center p-xxl overflow-hidden gradient-bg"
      >
        {/* WebGL Shader Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-0 opacity-30 pointer-events-none"
        />

        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none z-10">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="goals-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#goals-grid)" />
          </svg>
        </div>

        {/* Ambient Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.4)_0%,_transparent_50%)]"></div>
        </div>

        <div className="relative z-20 w-full max-w-md text-center">
          <div className="mb-xxl transform transition-transform duration-700 ease-out">
            <img
              alt="AI assistant helping students"
              className="w-full h-auto drop-shadow-2xl rounded-2xl"
              src="https://lh3.googleusercontent.com/aida/AP1WRLvdEogNMmrCLINH41zVgEorhMCBK1kIxFntxQb736WEzOsDoX17tdJ6o2M8tIgXNUnJOe2QSZNjPBLdyBrBkOOsWjRgCanU25_BxajSozN9EHwP58Ij9Izl3IKzsfRDPelzUEcC7GxmQCyXP3qrOCVI2AGavB0_y_AoUhlJZpb7BXjsJhzRQWBTl9rh5Ho6ei94KryltshQYIZp3KxIqgOMBUhuGh45a7dcE-iG24o5UJHT0bDN5Fym7Hw"
              style={{ transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)` }}
            />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-white mb-md font-bold leading-tight">
            Personalizing Your Journey
          </h1>
          <p className="font-body-lg text-body-lg text-white/80 leading-relaxed font-medium">
            Our AI assistant adapts to your unique learning style. Let's tailor Academent AI to help
            you achieve your academic goals faster.
          </p>
        </div>
      </section>

      {/* RIGHT SECTION: Form (60% width) */}
      <section className="w-full md:w-[60%] flex flex-col bg-surface-container-lowest">
        {/* HEADER */}
        <header className="fixed top-0 right-0 w-full md:w-[60%] z-50 bg-surface-container-lowest/80 backdrop-blur-md px-margin-mobile md:px-margin-desktop flex justify-between items-center border-b border-outline-variant/10 h-32">
          <div className="flex items-center gap-2">
            <div className="w-auto flex items-center h-14">
              <img
                alt="Academent AI Logo"
                className="h-full w-auto object-contain"
                src={logo}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-body-md text-body-md font-bold text-on-surface">Step 2 of 3</p>
              <p className="font-body-lg text-body-lg text-on-surface-variant font-medium">
                Learning Goals
              </p>
            </div>
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14">
                <circle
                  className="text-surface-variant"
                  cx="28"
                  cy="28"
                  fill="transparent"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <circle
                  className="text-primary progress-ring__circle"
                  cx="28"
                  cy="28"
                  fill="transparent"
                  r="24"
                  stroke="currentColor"
                  strokeDasharray="150.8"
                  strokeDashoffset="51.2"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-label-sm font-bold text-primary">
                66%
              </span>
            </div>
          </div>
        </header>

        {/* CONTENT SCROLLABLE */}
        <div className="flex-1 pb-36 px-margin-mobile md:px-margin-desktop overflow-y-auto custom-scrollbar pt-36">
          <form onSubmit={handleContinue} className="max-w-3xl mx-auto space-y-xxl">
            <div>
              <div className="mb-xl">
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs font-bold leading-tight">
                  How Can Academent AI Help You?
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                  Choose your learning goals and preferred study methods.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-xl rounded-2xl bg-error/10 px-md py-sm text-error font-label-md text-label-md">
                  {errorMessage}
                </div>
              )}

              {/* 1. Learning Goals Grid */}
              <div className="mb-xxl">
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-md font-semibold">
                  Learning Goals
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
                  {learningGoalsList.map((goal) => {
                    const isChecked = selectedGoals.includes(goal.id);
                    return (
                      <label key={goal.id} className="cursor-pointer group">
                        <input
                          checked={isChecked}
                          onChange={() => toggleGoal(goal.id)}
                          className="hidden"
                          type="checkbox"
                        />
                        <div
                          className={`selection-card h-full p-md border-2 border-surface-variant rounded-2xl flex flex-col gap-sm hover:border-primary/40 ${
                            isChecked ? 'selection-card-active' : ''
                          }`}
                        >
                          <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform text-2xl">
                            {goal.icon}
                          </span>
                          <span className="font-label-md text-label-md text-on-surface font-semibold">
                            {goal.text}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2. Study Style */}
              <div className="mb-xxl">
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-md font-semibold">
                  Study Style
                </h3>
                <div className="flex flex-wrap gap-sm">
                  {studyStylesList.map((style) => {
                    const isChecked = studyStyle === style.id;
                    return (
                      <label key={style.id} className="cursor-pointer group">
                        <input
                          checked={isChecked}
                          onChange={() => setStudyStyle(style.id)}
                          className="hidden"
                          name="studyStyleRadio"
                          type="radio"
                        />
                        <div
                          className={`selection-card px-lg py-md border-2 border-surface-variant rounded-full font-label-md text-label-md hover:border-primary transition-colors font-semibold ${
                            isChecked ? 'selection-card-active' : ''
                          }`}
                        >
                          {style.label}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 3. Study Time Commitment */}
              <div className="mb-xxl">
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-md font-semibold">
                  Study Time Commitment
                </h3>
                <div className="relative max-w-sm group">
                  <label
                    className="block font-label-sm text-label-sm text-on-surface-variant mb-xs ml-md font-semibold"
                    for="study-time"
                  >
                    How many hours do you study weekly?
                  </label>
                  <select
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value)}
                    className="w-full h-14 px-md bg-surface-container-low border-none rounded-2xl font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 appearance-none font-medium"
                    id="study-time"
                  >
                    <option value="less-5">Less than 5 hours</option>
                    <option value="5-10">5-10 hours</option>
                    <option value="10-20">10-20 hours</option>
                    <option value="20-plus">20+ hours</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-[calc(50%+4px)] transform -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <footer className="fixed bottom-0 right-0 w-full md:w-[60%] h-24 bg-surface-container-lowest/90 backdrop-blur-md px-margin-mobile md:px-margin-desktop flex items-center justify-between border-t border-outline-variant/10 z-40">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 px-lg py-md rounded-full font-label-md text-label-md text-primary border border-primary hover:bg-primary-fixed/30 transition-all active:scale-95 font-bold"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 text-label-md text-white shadow-lg hover:shadow-primary/30 hover:opacity-90 transition-all active:scale-95 group primary-button px-xxl py-3 rounded-xl font-bold"
              >
                {isSaving ? 'Saving...' : 'Continue'}
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

export default LearningGoalsPage;
