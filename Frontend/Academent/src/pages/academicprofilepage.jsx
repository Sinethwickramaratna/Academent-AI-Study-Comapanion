import { useState, useRef } from 'react';
import './academicprofilepage.css'
import LoadingEffect from '../components/LoadingEffect';
import logo from '../assets/Logo/Logo.png';
import { getFriendlyAuthError } from '../Services/authService';
import image from "../assets/Images/screen_1.png"
import WebGLBackground from '../components/WebGLBackground';
import CircularProgress from '../components/CircularProgress';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';

/**
 * AcademicProfilePage collects student profiling details (University, Degree, Major, Subjects, etc.)
 * during the onboarding phase. Features a WebGL background and custom 3D card tilt effects.
 * 
 * @param {function} onBack - Callback when back navigation is requested.
 * @param {function} onComplete - Callback when profiling is completed and saved.
 */
function AcademicProfilePage({ onBack, onComplete, initialData }) {
  const cardRef = useRef(null);

  // Form input field states
  const [university, setUniversity] = useState(initialData?.university || '');
  const [degree, setDegree] = useState(initialData?.degree || '');
  const [academicYear, setAcademicYear] = useState(initialData?.academicYear || 'Freshman (Year 1)');
  const [major, setMajor] = useState(initialData?.major || '');
  const [country, setCountry] = useState(initialData?.country || 'United States');
  const [language, setLanguage] = useState(initialData?.language || 'English (US)');
  const [selectedSubjects, setSelectedSubjects] = useState(initialData?.subjects || ['Computer Science']);

  // UI interaction states
  const [showToast, setShowToast] = useState(false);
  const [cardTransform, setCardTransform] = useState('rotateY(0deg) rotateX(0deg)');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Generates a 3D tilt transformation rotation on the form card
   * depending on the current relative mouse pointer position.
   */
  const handleCardMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (rect.left + rect.width / 2 - e.clientX) / 45;
    const y = (rect.top + rect.height / 2 - e.clientY) / 45;
    setCardTransform(`rotateY(${x}deg) rotateX(${y}deg)`);
  };

  /**
   * Resets card transforms when the mouse leaves card bounds.
   */
  const handleCardMouseLeave = () => {
    setCardTransform('rotateY(0deg) rotateX(0deg)');
  };

  // Subjects metadata list for profile selection tags
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

  /**
   * Selects or deselects academic subject tags.
   */
  const toggleSubject = (subjectName) => {
    if (selectedSubjects.includes(subjectName)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subjectName));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectName]);
    }
  };

  /**
   * Submits custom profile data to Firestore and advances onboarding flow.
   */
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      university: university.trim(),
      degree: degree.trim(),
      academicYear,
      major: major.trim(),
      country,
      language,
      subjects: selectedSubjects,
    };

    if (onComplete) {
      onComplete(data);
    }
  };


  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-surface font-body-md text-on-surface antialiased overflow-x-hidden relative">
      {/* Left Section: Brand Impact (40% / 1/3 width) */}
      <section className="hidden lg:flex lg:w-1/3 gradient-bg relative overflow-hidden items-center justify-center p-xxl">
        {/* WebGL Shader Background */}
        <WebGLBackground opacity={0.3} />

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
            src={image}
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
              <CircularProgress percentage={33} size={48} />
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
            {errorMessage && (
              <div className="rounded-2xl bg-error/10 px-md py-sm text-error font-label-md text-label-md">
                {errorMessage}
              </div>
            )}

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
                <FormInput
                  id="university"
                  name="university"
                  label="University/School"
                  icon="school"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Stanford University"
                />

                {/* Degree/Program */}
                <FormInput
                  id="degree"
                  name="degree"
                  label="Degree/Program"
                  icon="workspace_premium"
                  required
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. Bachelor of Science"
                />

                {/* Academic Year */}
                <FormSelect
                  id="academicYear"
                  name="academicYear"
                  label="Academic Year"
                  icon="event"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  options={[
                    { value: 'Freshman (Year 1)', label: 'Freshman (Year 1)' },
                    { value: 'Sophomore (Year 2)', label: 'Sophomore (Year 2)' },
                    { value: 'Junior (Year 3)', label: 'Junior (Year 3)' },
                    { value: 'Senior (Year 4)', label: 'Senior (Year 4)' },
                    { value: 'Postgraduate', label: 'Postgraduate' },
                  ]}
                />

                {/* Major/Specialization */}
                <FormInput
                  id="major"
                  name="major"
                  label="Major/Specialization"
                  icon="psychology"
                  required
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                />

                {/* Country */}
                <FormSelect
                  id="country"
                  name="country"
                  label="Country"
                  icon="public"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  options={[
                    { value: 'United States', label: 'United States' },
                    { value: 'United Kingdom', label: 'United Kingdom' },
                    { value: 'Canada', label: 'Canada' },
                    { value: 'Australia', label: 'Australia' },
                    { value: 'Germany', label: 'Germany' },
                  ]}
                />

                {/* Preferred Language */}
                <FormSelect
                  id="language"
                  name="language"
                  label="Preferred Language"
                  icon="translate"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  options={[
                    { value: 'English (US)', label: 'English (US)' },
                    { value: 'English (UK)', label: 'English (UK)' },
                    { value: 'Spanish', label: 'Spanish' },
                    { value: 'French', label: 'French' },
                    { value: 'Mandarin', label: 'Mandarin' },
                  ]}
                />
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
                disabled={isSaving}
                className="primary-button px-xxl py-3 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg"
              >
                {isSaving ? <LoadingEffect variant="inline" title="Saving" /> : 'Continue'} <span className="material-symbols-outlined">arrow_forward</span>
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
