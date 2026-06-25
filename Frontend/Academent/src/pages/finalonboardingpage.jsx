import { useState, useRef } from 'react';
import './finalonboardingpage.css';
import logo from '../assets/Logo/Logo.png';
import { getFriendlyAuthError, updateUserProfileData } from '../Services/authService';
import { useAuth } from '../context/AuthContext';
import WebGLBackground from '../components/WebGLBackground';
import CircularProgress from '../components/CircularProgress';
import SelectionCard from '../components/SelectionCard';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';

/**
 * FinalOnboardingPage captures final profiling items (Academic goals, Target GPA, Primary goal).
 * Once completed, the student's onboarding completion status is saved.
 * 
 * @param {function} onBack - Navigation back request callback.
 * @param {function} onComplete - Navigation request callback upon complete profile submission.
 */
function FinalOnboardingPage({ onBack, onComplete, academicProfileData, learningPreferencesData }) {
  const { refreshProfile } = useAuth();
  const leftSectionRef = useRef(null);

  // Form input field state hooks
  const [selectedGoals, setSelectedGoals] = useState(['grades', 'complete']);
  const [targetGpa, setTargetGpa] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('Pass Upcoming Exams');

  // Parallax decoration offset state
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Calculates parallax offsets based on mouse moves.
   */
  const handleLeftSectionMouseMove = (e) => {
    const rect = leftSectionRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = (e.clientX - rect.left - centerX) / 60;
    const deltaY = (e.clientY - rect.top - centerY) / 60;
    setParallaxOffset({ x: deltaX, y: deltaY });
  };

  // Academic goals metadata checklist options
  const goalsList = [
    { id: 'grades', icon: 'trending_up', label: 'Improve Grades' },
    { id: 'exams', icon: 'edit_note', label: 'Prepare for Exams' },
    { id: 'organized', icon: 'calendar_month', label: 'Stay Organized' },
    { id: 'skills', icon: 'psychology', label: 'Learn New Skills' },
    { id: 'complete', icon: 'bolt', label: 'Complete Faster' },
    { id: 'habits', icon: 'history_edu', label: 'Study Habits' },
  ];

  /**
   * Selection toggler for academic goals.
   */
  const toggleGoal = (goalId) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((id) => id !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  /**
   * Main submit handler for saving profile data and completing onboarding.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    setErrorMessage('');

    try {
      await updateUserProfileData({
        academicProfile: academicProfileData,
        learningPreferences: learningPreferencesData,
        academicGoals: {
          goals: selectedGoals,
          targetGpa: targetGpa.trim(),
          primaryGoal,
        },
        onboardingCompleted: true, // Marks user onboarding completion flag to true
        onboardingStep: 'complete',
      });

      await refreshProfile();

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
        <WebGLBackground opacity={0.3} />

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
            <CircularProgress percentage={100} size={56} />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
              {goalsList.map((goal) => {
                const isChecked = selectedGoals.includes(goal.id);
                return (
                  <SelectionCard
                    key={goal.id}
                    id={goal.id}
                    name="goalsChecklist"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleGoal(goal.id)}
                    icon={goal.icon}
                    label={goal.label}
                  />
                );
              })}
            </div>

            {/* Input Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg pt-md">
              <FormInput
                id="targetGpa"
                name="targetGpa"
                label="Target GPA"
                value={targetGpa}
                onChange={(e) => setTargetGpa(e.target.value)}
                placeholder="e.g. 4.0"
              />

              <FormSelect
                id="primaryGoal"
                name="primaryGoal"
                label="Primary Goal"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                options={[
                  { value: 'Pass Upcoming Exams', label: 'Pass Upcoming Exams' },
                  { value: 'Improve Weak Subjects', label: 'Improve Weak Subjects' },
                  { value: 'Increase GPA', label: 'Increase GPA' },
                  { value: 'Complete Semester Successfully', label: 'Complete Semester Successfully' },
                  { value: 'Learn New Topics', label: 'Learn New Topics' },
                ]}
              />
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
