import { useState, useEffect } from 'react';
import './dashboardpage.css';
import logo from '../assets/Logo/Logo.png';
import { useAuth } from '../context/AuthContext';
import { logoutUser, getUserProfileData } from '../Services/authService';
import { useNavigate } from 'react-router-dom';

/**
 * DashboardPage component represents the study companion central control panel.
 * Displays student's custom courses, goals progress, and study tools.
 */
function DashboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Profile state loaded from Firestore
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  // Load user profile on component mount
  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) return;
      try {
        const data = await getUserProfileData(currentUser.uid);
        setProfile(data);
      } catch (error) {
        console.error("Failed to load user profile:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [currentUser]);

  /**
   * Log out currently signed-in user and redirect to login page.
   */
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-md">
        <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
        <p className="font-label-md text-on-surface-variant animate-pulse font-bold">Loading dashboard...</p>
      </div>
    );
  }

  // Fallbacks if Firestore profile does not exist yet
  const fullName = profile?.fullName || currentUser?.displayName || "Student";
  const university = profile?.academicProfile?.university || "Your University";
  const degree = profile?.academicProfile?.degree || "Undergraduate";
  const major = profile?.academicProfile?.major || "Undecided Major";
  const subjects = profile?.academicProfile?.subjects || ["General Study"];
  const goals = profile?.learningPreferences?.learningGoals || ["explain"];
  const studyStyle = profile?.learningPreferences?.studyStyle || "visual";
  const weeklyHours = profile?.learningPreferences?.weeklyHours || "5-10";

  return (
    <div className="dashboard min-h-screen bg-background text-on-surface font-body-md flex">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar w-80 bg-white border-r border-outline-variant/30 flex flex-col py-xl px-lg select-none">
        <div className="flex items-center gap-md mb-xxl">
          <img
            alt="Academent AI Logo"
            className="h-10 w-10 bg-primary-fixed rounded-lg p-2 object-contain"
            src={logo}
          />
          <div>
            <h1 className="font-headline-lg text-headline-md font-extrabold text-primary leading-tight">
              Academent AI
            </h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              Study Companion
            </p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-sm">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-md p-md rounded-xl transition-all duration-300 font-bold ${
              activeTab === 'home'
                ? 'bg-primary/10 text-primary border-r-4 border-primary'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-md p-md rounded-xl transition-all duration-300 font-bold ${
              activeTab === 'courses'
                ? 'bg-primary/10 text-primary border-r-4 border-primary'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined">import_contacts</span>
            <span className="font-label-md">My Courses</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-tutor')}
            className={`flex items-center gap-md p-md rounded-xl transition-all duration-300 font-bold ${
              activeTab === 'ai-tutor'
                ? 'bg-primary/10 text-primary border-r-4 border-primary'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined">psychology</span>
            <span className="font-label-md">AI Study Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-md p-md rounded-xl transition-all duration-300 font-bold ${
              activeTab === 'settings'
                ? 'bg-primary/10 text-primary border-r-4 border-primary'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md">Settings</span>
          </button>
        </nav>

        <div className="mt-auto pt-md border-t border-outline-variant/20 flex flex-col gap-sm">
          <div className="flex items-center gap-md px-sm py-xs">
            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-label-md font-bold text-on-surface truncate">{fullName}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-md py-sm rounded-xl border border-error/20 text-error hover:bg-error/5 transition-colors font-bold mt-2"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-label-md">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="flex-1 min-h-screen flex flex-col p-xxl overflow-y-auto">
        <header className="flex justify-between items-center mb-xl">
          <div>
            <h2 className="font-display-lg text-display-lg text-primary mb-xs">Welcome back, {fullName}!</h2>
            <p className="font-body-md text-on-surface-variant font-medium">Ready to continue your personalized learning path?</p>
          </div>
          <div className="flex items-center gap-md bg-white border border-outline-variant/30 px-md py-sm rounded-2xl shadow-sm">
            <span className="material-symbols-outlined text-tertiary-fixed-dim">schedule</span>
            <span className="font-label-md font-bold text-on-surface">{weeklyHours} hours target / week</span>
          </div>
        </header>

        {activeTab === 'home' && (
          <div className="space-y-xl animate-fade-in-up">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              <div className="stat-card bg-gradient-to-br from-primary to-primary-container text-white p-lg rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-9xl font-extrabold select-none">AI</div>
                <div className="flex items-center justify-between mb-md">
                  <span className="material-symbols-outlined text-3xl text-primary-fixed-dim">school</span>
                  <span className="font-label-sm bg-white/20 px-sm py-xs rounded-full">Primary Role</span>
                </div>
                <p className="font-label-sm text-white/70 font-semibold mb-xs">Academic Status</p>
                <p className="font-headline-md text-xl font-bold">{degree}</p>
                <p className="font-label-sm text-white/60 mt-sm font-medium">{university}</p>
              </div>

              <div className="stat-card bg-white border border-outline-variant/30 p-lg rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-md">
                  <span className="material-symbols-outlined text-3xl text-secondary">psychology</span>
                  <span className="font-label-sm bg-secondary/10 text-secondary px-sm py-xs rounded-full">Style</span>
                </div>
                <p className="font-label-sm text-on-surface-variant font-semibold mb-xs">Learning Preference</p>
                <p className="font-headline-md text-xl text-on-surface font-extrabold capitalize">{studyStyle} Learner</p>
                <p className="font-label-sm text-on-surface-variant mt-sm font-medium">AI adapts recommendations accordingly</p>
              </div>

              <div className="stat-card bg-white border border-outline-variant/30 p-lg rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-md">
                  <span className="material-symbols-outlined text-3xl text-tertiary-fixed-dim">target</span>
                  <span className="font-label-sm bg-tertiary-fixed-dim/20 text-tertiary px-sm py-xs rounded-full">Focus</span>
                </div>
                <p className="font-label-sm text-on-surface-variant font-semibold mb-xs">Enrolled Major</p>
                <p className="font-headline-md text-xl text-on-surface font-extrabold truncate">{major}</p>
                <p className="font-label-sm text-on-surface-variant mt-sm font-medium">Core subject tracking is active</p>
              </div>
            </div>

            {/* Courses and Study Goals Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
              {/* Courses Card */}
              <div className="bg-white border border-outline-variant/30 p-lg rounded-2xl shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-lg">
                  <h3 className="font-headline-md text-primary font-bold flex items-center gap-sm">
                    <span className="material-symbols-outlined">menu_book</span>
                    My Enrolled Subjects
                  </h3>
                  <button className="text-primary font-label-md font-bold hover:underline" onClick={() => setActiveTab('courses')}>
                    View All
                  </button>
                </div>
                <div className="flex flex-wrap gap-sm">
                  {subjects.map((subject, idx) => (
                    <div
                      key={idx}
                      className="px-md py-sm bg-surface-container-low border border-outline-variant/20 rounded-xl flex items-center gap-sm font-medium text-on-surface hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-primary text-[20px]">school</span>
                      <span>{subject}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Goals Card */}
              <div className="bg-white border border-outline-variant/30 p-lg rounded-2xl shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-lg">
                  <h3 className="font-headline-md text-primary font-bold flex items-center gap-sm">
                    <span className="material-symbols-outlined">fact_check</span>
                    Personalized AI Goals
                  </h3>
                </div>
                <ul className="space-y-sm flex-1">
                  {goals.includes('explain') && (
                    <li className="flex items-center gap-md p-sm bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                      <span className="material-symbols-outlined text-secondary">psychology</span>
                      <span className="font-label-md text-on-surface font-semibold">Enable conceptual explanations for hard topics</span>
                    </li>
                  )}
                  {goals.includes('quizzes') && (
                    <li className="flex items-center gap-md p-sm bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                      <span className="material-symbols-outlined text-secondary">quiz</span>
                      <span className="font-label-md text-on-surface font-semibold">Prepare automated revision quizzes from notes</span>
                    </li>
                  )}
                  {goals.includes('flashcards') && (
                    <li className="flex items-center gap-md p-sm bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                      <span className="material-symbols-outlined text-secondary">style</span>
                      <span className="font-label-md text-on-surface font-semibold">Generate topic-specific flashcards</span>
                    </li>
                  )}
                  {goals.includes('summarize') && (
                    <li className="flex items-center gap-md p-sm bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                      <span className="material-symbols-outlined text-secondary">summarize</span>
                      <span className="font-label-md text-on-surface font-semibold">Summarize heavy documents & textbooks</span>
                    </li>
                  )}
                  {goals.map((g, idx) => {
                    // Filter out already standard handled cases above, render remaining items
                    if (['explain', 'quizzes', 'flashcards', 'summarize'].includes(g)) return null;
                    return (
                      <li key={idx} className="flex items-center gap-md p-sm bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                        <span className="material-symbols-outlined text-secondary">task_alt</span>
                        <span className="font-label-md text-on-surface font-semibold capitalize">{g.replace('_', ' ')}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            {/* AI Assistant Tools section */}
            <div className="bg-white border border-outline-variant/30 p-lg rounded-2xl shadow-sm">
              <h3 className="font-headline-md text-primary font-bold mb-lg flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary">bolt</span>
                Quick Launch AI Study Tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
                <div
                  onClick={() => setActiveTab('ai-tutor')}
                  className="p-md border border-outline-variant/30 rounded-xl hover:border-primary hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="material-symbols-outlined text-3xl text-primary mb-md">chat_bubble</span>
                    <h4 className="font-label-md text-on-surface font-bold mb-xs">Conceptual Tutor</h4>
                    <p className="font-label-sm text-on-surface-variant font-medium">Chat with AI for instant detailed topic breakdowns.</p>
                  </div>
                  <span className="text-primary font-bold text-sm mt-md inline-block">Start Tutor →</span>
                </div>

                <div
                  onClick={() => setActiveTab('ai-tutor')}
                  className="p-md border border-outline-variant/30 rounded-xl hover:border-primary hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="material-symbols-outlined text-3xl text-secondary mb-md">note_add</span>
                    <h4 className="font-label-md text-on-surface font-bold mb-xs">Quiz Generator</h4>
                    <p className="font-label-sm text-on-surface-variant font-medium">Upload notes and compile practice revision questions.</p>
                  </div>
                  <span className="text-secondary font-bold text-sm mt-md inline-block">Compile Quiz →</span>
                </div>

                <div
                  onClick={() => setActiveTab('ai-tutor')}
                  className="p-md border border-outline-variant/30 rounded-xl hover:border-primary hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="material-symbols-outlined text-3xl text-tertiary-fixed-dim mb-md">calendar_today</span>
                    <h4 className="font-label-md text-on-surface font-bold mb-xs">Study Scheduler</h4>
                    <p className="font-label-sm text-on-surface-variant font-medium">Build an optimized calendar timeline for exams.</p>
                  </div>
                  <span className="text-tertiary font-bold text-sm mt-md inline-block">Schedule →</span>
                </div>

                <div
                  onClick={() => setActiveTab('ai-tutor')}
                  className="p-md border border-outline-variant/30 rounded-xl hover:border-primary hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="material-symbols-outlined text-3xl text-error mb-md">analytics</span>
                    <h4 className="font-label-md text-on-surface font-bold mb-xs">Progress Tracker</h4>
                    <p className="font-label-sm text-on-surface-variant font-medium">Evaluate study hours and conceptual readiness.</p>
                  </div>
                  <span className="text-error font-bold text-sm mt-md inline-block">Track Progress →</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'home' && (
          <div className="bg-white border border-outline-variant/30 p-xxl rounded-2xl shadow-sm text-center py-xxl animate-fade-in-up">
            <span className="material-symbols-outlined text-6xl text-primary-fixed-dim mb-md">construction</span>
            <h3 className="font-headline-md text-on-surface font-bold mb-sm">Feature Under Construction</h3>
            <p className="font-body-md text-on-surface-variant max-w-md mx-auto mb-lg">
              The onboarding is completed, and this view is prepared. The core study tools features of the dashboard tab are coming soon.
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="px-lg py-md bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-shadow"
            >
              Back to Home
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
