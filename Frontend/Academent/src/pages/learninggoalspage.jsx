import { useState, useRef } from 'react';
import './learninggoalspage.css';
import logo from '../assets/Logo/Logo.png';
import { getFriendlyAuthError } from '../Services/authService';
import WebGLBackground from '../components/WebGLBackground';
import CircularProgress from '../components/CircularProgress';
import SelectionCard from '../components/SelectionCard';
import FormSelect from '../components/FormSelect';

/**
 * LearningGoalsPage captures the user's preferred study style, goal set,
 * and weekly commitment hours. Features WebGL and parallax decoration.
 * 
 * @param {function} onBack - Navigation back request callback.
 * @param {function} onComplete - Proceeding navigation request callback on completion.
 */
function LearningGoalsPage({ onBack, onComplete, initialData }) {
  const leftSectionRef = useRef(null);

  // Form input field state hooks
  const [selectedGoals, setSelectedGoals] = useState(initialData?.learningGoals || ['explain']);
  const [studyStyle, setStudyStyle] = useState(initialData?.studyStyle || 'visual');
  const [weeklyHours, setWeeklyHours] = useState(initialData?.weeklyHours || '5-10');

  // Parallax decoration offset state
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
        <WebGLBackground opacity={0.3} />

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
              <CircularProgress percentage={66} size={56} />
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
                      <SelectionCard
                        key={goal.id}
                        id={goal.id}
                        name="learningGoals"
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleGoal(goal.id)}
                        icon={goal.icon}
                        label={goal.text}
                      />
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
                      <SelectionCard
                        key={style.id}
                        id={style.id}
                        name="studyStyleRadio"
                        type="radio"
                        checked={isChecked}
                        onChange={() => setStudyStyle(style.id)}
                        label={style.label}
                        cardClassName="selection-card rounded-full font-label-md text-label-md hover:border-primary transition-colors font-semibold"
                        className="px-lg py-md border-2 border-surface-variant"
                      />
                    );
                  })}
                </div>
              </div>

              {/* 3. Study Time Commitment */}
              <div className="mb-xxl">
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-md font-semibold">
                  Study Time Commitment
                </h3>
                <FormSelect
                  id="study-time"
                  name="studyTime"
                  label="How many hours do you study weekly?"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                  containerClassName="max-w-sm"
                  className="h-14 px-md bg-surface-container-low border-none rounded-2xl font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 font-medium"
                  options={[
                    { value: 'less-5', label: 'Less than 5 hours' },
                    { value: '5-10', label: '5-10 hours' },
                    { value: '10-20', label: '10-20 hours' },
                    { value: '20-plus', label: '20+ hours' },
                  ]}
                />
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
