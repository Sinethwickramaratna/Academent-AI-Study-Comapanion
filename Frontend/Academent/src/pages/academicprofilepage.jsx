import { useState, useEffect, useRef } from 'react';
import './academicprofilepage.css';
import logo from '../assets/Logo/Logo.png';

function AcademicProfilePage({ onBack, onComplete }) {
  const canvasRef = useRef(null);
  const cardRef = useRef(null);

  // Form states
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [academicYear, setAcademicYear] = useState('Freshman (Year 1)');
  const [major, setMajor] = useState('');
  const [country, setCountry] = useState('United States');
  const [language, setLanguage] = useState('English (US)');
  const [selectedSubjects, setSelectedSubjects] = useState(['Computer Science']);

  // UI States
  const [showToast, setShowToast] = useState(false);
  const [cardTransform, setCardTransform] = useState('rotateY(0deg) rotateX(0deg)');

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

  // Card 3D Depth Mousemove tilt effect
  const handleCardMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (rect.left + rect.width / 2 - e.clientX) / 45;
    const y = (rect.top + rect.height / 2 - e.clientY) / 45;
    setCardTransform(`rotateY(${x}deg) rotateX(${y}deg)`);
  };

  const handleCardMouseLeave = () => {
    setCardTransform('rotateY(0deg) rotateX(0deg)');
  };

  // Subjects data
  const subjects = [
    { name: 'Mathematics', icon: 'functions' },
    { name: 'Physics', icon: 'biotech' },
    { name: 'Chemistry', icon: 'science' },
    { name: 'Biology', icon: 'urology' },
    { name: 'Computer Science', icon: 'terminal' },
    { name: 'Software Engineering', icon: 'developer_mode' },
    { name: 'Data Science', icon: 'database' },
    { name: 'Economics', icon: 'trending_up' },
    { name: 'Business Management', icon: 'business_center' },
    { name: 'Accounting', icon: 'account_balance' },
    { name: 'Statistics', icon: 'bar_chart' },
  ];

  const toggleSubject = (subjectName) => {
    if (selectedSubjects.includes(subjectName)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subjectName));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectName]);
    }
  };

  // Form submission handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      if (onComplete) {
        onComplete();
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-surface font-body-md text-on-surface antialiased overflow-x-hidden relative">
      {/* Left Section: Brand Impact (40% / 1/3 width) */}
      <section className="hidden lg:flex lg:w-1/3 gradient-bg relative overflow-hidden items-center justify-center p-xxl">
        {/* WebGL Shader Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full -z-10 opacity-30 pointer-events-none"
        />

        {/* Grid Background overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="profile-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#profile-grid)" />
          </svg>
        </div>

        {/* Atmospheric Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>

        <div className="relative z-10 w-full max-w-md text-center">
          <img
            alt="Academent AI Illustration"
            className="w-full h-auto drop-shadow-2xl transform hover:scale-105 transition-transform duration-700"
            src="https://lh3.googleusercontent.com/aida/AP1WRLvSl0MPtC06vfUDPhuQr0AwIWaQVDIZ6g_UXQmC49Q3SFb2EGFLV_Yu_uq3xdr0MYTI9a6pklGPv64NAitdMfxP4gVXdC-v057kg6NHIKTtjoItNpX4BtDLu6RSlviNYj8aEWQNSRhBXs_AM-NeD8owlPN4YCjJRDygW26bwWCDmIkqaxySJj7XhX4RbVAyHRNwWqxY5uQRfcUDOBlqgPikBD_oONEEVoSMH_83aemZXbOJ9Sxh48o5uhs"
          />
          <div className="mt-xl text-white space-y-md">
            <h2 className="font-headline-lg text-headline-lg font-bold">Future of Learning</h2>
            <p className="font-body-md text-body-lg opacity-85 leading-relaxed font-medium">
              Join thousands of students leveraging AI-powered insights to master their academic
              journey with precision.
            </p>
          </div>
        </div>

        {/* Visual decorations */}
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
      </section>

      {/* Right Section: Interactive Setup (60% / 2/3 width) */}
      <section className="flex-1 bg-white p-margin-mobile md:p-margin-desktop lg:p-xxl flex flex-col items-center overflow-y-auto">
        {/* Mobile progress bar */}
        <div className="w-full max-w-2xl lg:hidden mb-lg">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-primary font-bold text-label-md">Setup Progress</span>
            <span className="text-on-surface-variant text-label-sm">Step 1 of 3</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-primary transition-all duration-500"></div>
          </div>
        </div>

        <div className="w-full max-w-2xl">
          {/* Header */}
          <header className="flex justify-between items-center mb-xl">
            <img alt="Academent AI Logo" className="h-10 w-auto object-contain" src={logo} />
            <div className="hidden lg:flex items-center gap-md">
              <div className="text-right">
                <p className="text-label-sm text-on-surface-variant font-medium">Step 1 of 3</p>
                <p className="text-label-md font-bold text-primary">Academic Info</p>
              </div>
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    className="text-surface-container"
                    cx="24"
                    cy="24"
                    fill="transparent"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <circle
                    className="text-primary"
                    cx="24"
                    cy="24"
                    fill="transparent"
                    r="20"
                    stroke="currentColor"
                    strokeDasharray="125.6"
                    strokeDashoffset="84.2"
                    strokeWidth="4"
                  />
                </svg>
                <span className="absolute text-label-sm font-bold text-primary">33%</span>
              </div>
            </div>
          </header>

          {/* Title block */}
          <div className="mb-xl">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs font-bold leading-tight">
              Tell Us About Your Studies
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg font-medium">
              We'll personalize your learning experience based on your academic profile.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-xl">
            {/* Setup Form Glassmorphism Card */}
            <div className="perspective-container">
              <div
                ref={cardRef}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                className="glass-card p-xl rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-xl"
                style={{ transform: cardTransform }}
              >
                {/* University/School */}
                <div className="space-y-xs group">
                  <label className="text-label-md font-label-md text-on-surface group-focus-within:text-primary transition-colors flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[18px]">school</span> University/School
                  </label>
                  <input
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full px-md py-3 bg-[#F9FAFB] border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md input-focus"
                    placeholder="e.g. Stanford University"
                    type="text"
                  />
                </div>

                {/* Degree/Program */}
                <div className="space-y-xs group">
                  <label className="text-label-md font-label-md text-on-surface group-focus-within:text-primary transition-colors flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span> Degree/Program
                  </label>
                  <input
                    required
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-md py-3 bg-[#F9FAFB] border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md input-focus"
                    placeholder="e.g. Bachelor of Science"
                    type="text"
                  />
                </div>

                {/* Academic Year */}
                <div className="space-y-xs group">
                  <label className="text-label-md font-label-md text-on-surface group-focus-within:text-primary transition-colors flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[18px]">event</span> Academic Year
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-md py-3 bg-[#F9FAFB] border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md input-focus appearance-none"
                  >
                    <option value="Freshman (Year 1)">Freshman (Year 1)</option>
                    <option value="Sophomore (Year 2)">Sophomore (Year 2)</option>
                    <option value="Junior (Year 3)">Junior (Year 3)</option>
                    <option value="Senior (Year 4)">Senior (Year 4)</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>

                {/* Major/Specialization */}
                <div className="space-y-xs group">
                  <label className="text-label-md font-label-md text-on-surface group-focus-within:text-primary transition-colors flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[18px]">psychology</span> Major/Specialization
                  </label>
                  <input
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full px-md py-3 bg-[#F9FAFB] border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md input-focus"
                    placeholder="e.g. Computer Science"
                    type="text"
                  />
                </div>

                {/* Country */}
                <div className="space-y-xs group">
                  <label className="text-label-md font-label-md text-on-surface group-focus-within:text-primary transition-colors flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[18px]">public</span> Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-md py-3 bg-[#F9FAFB] border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md input-focus appearance-none"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                  </select>
                </div>

                {/* Preferred Language */}
                <div className="space-y-xs group">
                  <label className="text-label-md font-label-md text-on-surface group-focus-within:text-primary transition-colors flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[18px]">translate</span> Preferred Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-md py-3 bg-[#F9FAFB] border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md input-focus appearance-none"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="Mandarin">Mandarin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subjects Selection Section */}
            <div>
              <h3 className="text-headline-md font-headline-md mb-md font-bold text-on-surface">
                Select Subjects of Interest
              </h3>
              <div className="flex flex-wrap gap-sm">
                {subjects.map((sub) => {
                  const isActive = selectedSubjects.includes(sub.name);
                  return (
                    <button
                      key={sub.name}
                      type="button"
                      onClick={() => toggleSubject(sub.name)}
                      className={`px-md py-2 border border-outline-variant rounded-full text-label-md hover:bg-surface-container-low transition-all duration-200 flex items-center gap-2 font-medium ${
                        isActive ? 'chip-active shadow-sm' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{sub.icon}</span>
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <footer className="flex items-center justify-between pt-lg border-t border-surface-container">
              <button
                type="button"
                onClick={onBack}
                className="px-xl py-3 text-primary font-bold hover:bg-primary/5 rounded-xl transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_back</span> Back
              </button>

              <button
                type="submit"
                className="primary-button px-xxl py-3 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg"
              >
                Continue <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </footer>
          </form>
        </div>
      </section>

      {/* Success Toast Notification */}
      <div
        className={`fixed bottom-10 right-10 flex items-center gap-md bg-inverse-surface text-inverse-on-surface px-xl py-md rounded-2xl shadow-2xl transition-all duration-500 z-[100] ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center">
          <span
            className="material-symbols-outlined text-on-tertiary-fixed text-[20px]"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            check
          </span>
        </div>
        <div className="text-left">
          <p className="font-bold text-label-md">Profile Progress Saved</p>
          <p className="text-label-sm opacity-80 font-medium">
            You can return to this step anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AcademicProfilePage;
