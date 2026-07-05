import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import './dashboardpage.css';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { logoutUser, getUserProfileData } from '../Services/authService';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingEffect from '../components/LoadingEffect';
import TopBar from '../components/TopBar';
import { dashboardWindowItems, getDashboardRouteForTab, getDashboardTabForPath } from '../routes/windowRoutes';

const NotePage = lazy(() => import('./notepage'));
const QuizGeneratorPage = lazy(() => import('./quizgeneratorpage'));
const AITutorPage = lazy(() => import('./aitutorpage'));
const StudyPlannerPage = lazy(() => import('./studyplannerpage'));
const FlashCardsPage = lazy(() => import('./flashcardspage'));
const AnalyticsPage = lazy(() => import('./analyticspage'));

/**
 * DashboardPage component represents the study companion central control panel.
 * Displays student's custom courses, goals progress, and study tools.
 */
function DashboardPage({ initialActiveTab = 'home' }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeActiveTab = getDashboardTabForPath(location.pathname) || initialActiveTab || 'home';
  
  // Profile state loaded from Firestore
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(routeActiveTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [quizToOpenId, setQuizToOpenId] = useState(null);

  useEffect(() => {
    setActiveTab(routeActiveTab);
    setIsMobileMenuOpen(false);
  }, [routeActiveTab]);
  
  
  // Task list state (Interactive)
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Physics Problem Set #4",
      tag: "Urgent",
      tagColor: "bg-error-container text-on-error-container",
      borderHover: "hover:border-error/50",
      barColor: "bg-error",
      progress: 65,
      due: "Due Today at 11:59 PM",
      completed: false
    },
    {
      id: 2,
      title: "Bioethics Essay Outline",
      tag: "Upcoming",
      tagColor: "bg-surface-container-highest text-on-surface-variant",
      borderHover: "hover:border-primary/50",
      barColor: "bg-primary",
      progress: 30,
      due: "Due in 2 days",
      completed: false
    },
    {
      id: 3,
      title: "Daily Flashcard Review",
      tag: "Routine",
      tagColor: "bg-surface-container-highest text-on-surface-variant",
      borderHover: "hover:border-tertiary-fixed-dim/50",
      barColor: "bg-tertiary-fixed-dim",
      progress: 90,
      due: "Daily Task",
      completed: false
    }
  ]);

  // AI Tutor Messages state (Interactive)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: "Can you explain Newton's Second Law with a real-world example? I'm struggling to visualize it.",
      avatar: ""
    },
    {
      id: 2,
      sender: 'ai',
      text: "Newton's Second Law (F = ma) basically states that the force acting on an object is equal to its mass times its acceleration.",
      details: {
        title: "???? The Car Example:",
        content: "Imagine pushing a toy car vs. a real car. If you apply the same strength (force), the toy car accelerates much faster because it has less mass. To make the real car move at the same speed, you'd need a massive amount of force."
      },
      actions: ["Generate Quiz", "Save to Notes"]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Recent Study Materials state (Interactive)
  const [materials, setMaterials] = useState([
    { 
      id: 1, 
      name: "Lecture_04_Kinematics.pdf", 
      info: "Last opened 2h ago ??? 12 pages", 
      icon: "picture_as_pdf", 
      iconColor: "bg-blue-100 text-blue-600", 
      btn1: "Summarize", 
      btn2: "Generate Quiz" 
    },
    { 
      id: 2, 
      name: "Chemistry Lab Notes (Week 6)", 
      info: "Edited Yesterday ??? 2,400 words", 
      icon: "edit_note", 
      iconColor: "bg-purple-100 text-purple-600", 
      btn1: "Summarize", 
      btn2: "Flashcards" 
    },
    { 
      id: 3, 
      name: "Organic_Chem_Full_Lecture.mp4", 
      info: "AI Transcribed ??? 54 mins", 
      icon: "slideshow", 
      iconColor: "bg-orange-100 text-orange-600", 
      btn1: "Review Outline", 
      btn2: "Ask Video" 
    }
  ]);

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

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

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

  const switchToTab = (tabId) => {
    const nextRoute = getDashboardRouteForTab(tabId);
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);

    if (location.pathname !== nextRoute) {
      navigate(nextRoute);
    }
  };

  // Toggle task completed state
  const toggleTaskCompleted = (id) => {
    setTasks(prev => prev.map(t => 
      t.id === id 
        ? { 
            ...t, 
            completed: !t.completed, 
            progress: t.completed ? (t.prevProgress !== undefined ? t.prevProgress : 50) : 100, 
            prevProgress: t.progress 
          } 
        : t
    ));
  };

  // Add a task in state
  const handleAddTask = () => {
    const title = prompt("Enter task title:");
    if (!title) return;
    const tagInput = prompt("Enter task priority (Urgent, Upcoming, Routine):", "Upcoming") || "Upcoming";
    const due = prompt("Enter due date (e.g. Due in 3 days):", "Due soon") || "Due soon";
    
    let tag = "Upcoming";
    let tagColor = "bg-surface-container-highest text-on-surface-variant";
    let borderHover = "hover:border-primary/50";
    let barColor = "bg-primary";
    
    const normalizedTag = tagInput.trim().toLowerCase();
    if (normalizedTag === 'urgent') {
      tag = "Urgent";
      tagColor = "bg-error-container text-on-error-container";
      borderHover = "hover:border-error/50";
      barColor = "bg-error";
    } else if (normalizedTag === 'routine') {
      tag = "Routine";
      tagColor = "bg-surface-container-highest text-on-surface-variant";
      borderHover = "hover:border-tertiary-fixed-dim/50";
      barColor = "bg-tertiary-fixed-dim";
    }
    
    const newTask = {
      id: Date.now(),
      title,
      tag,
      tagColor,
      borderHover,
      barColor,
      progress: 0,
      due,
      completed: false
    };
    
    setTasks(prev => [...prev, newTask]);
  };

  // Send a chat message
  const handleSendMessage = (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;
    
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      avatar: photoURL
    };
    
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);
    
    // Simulate AI response after 1.2 seconds
    setTimeout(() => {
      let replyText = "I've analyzed your question! As your AI Study Tutor, I'm here to help you master this topic. What specific details can I clear up for you?";
      let details = null;
      let actions = ["Generate Quiz", "Save to Notes"];
      
      const lower = text.toLowerCase();
      if (lower.includes('newton') || lower.includes('law')) {
        replyText = "Newton's Second Law (F = ma) states that force equals mass times acceleration. Let's look at another example:";
        details = {
          title: "?????? The Baseball Example:",
          content: "A professional pitcher throws a baseball with huge force, giving it high acceleration. Throwing a heavy bowling ball with the same force would result in much lower acceleration due to its massive weight."
        };
      } else if (lower.includes('kinematics') || lower.includes('lecture')) {
        replyText = "I see you're studying Kinematics! This branch of mechanics describes the motion of points, bodies, and systems without reference to the forces that cause the motion.";
        details = {
          title: "???? Key Concepts in Kinematics:",
          content: "Focus on the big four equations of motion. They link Displacement (d), Initial Velocity (vi), Final Velocity (vf), Acceleration (a), and Time (t). Make sure you understand how to solve for one unknown when given three known values."
        };
        actions = ["Generate Flashcards", "Practice Problems"];
      } else if (lower.includes('chemistry') || lower.includes('organic')) {
        replyText = "Organic chemistry is all about understanding carbon compounds and functional groups. Let's break it down:";
        details = {
          title: "???? Study Tip for Organic Chem:",
          content: "Do not just memorize reactions. Focus on nucleophiles and electrophiles (mechanisms). Once you know where the electrons want to go, you can predict almost any reaction."
        };
        actions = ["Flashcard Quiz", "Reaction Guide"];
      } else if (lower.includes('gpa') || lower.includes('grade')) {
        replyText = "Your GPA progress is looking great this term! To raise your GPA further, consistency is key. Keep maintaining your 12-day study streak.";
        details = {
          title: "???? GPA Goal Booster:",
          content: "Spend just 15 minutes reviewing active flashcards every morning. Spaced repetition has been shown to raise average quiz scores by up to 15%."
        };
      } else if (lower.includes('essay') || lower.includes('ethics') || lower.includes('bioethics')) {
        replyText = "Writing a bioethics outline can be challenging. I recommend organizing it around the four main principles of biomedical ethics:";
        details = {
          title: "???? The Four Bioethics Pillars:",
          content: "1. Autonomy (respecting decision making)\n2. Beneficence (acting in the patient's best interest)\n3. Non-maleficence (doing no harm)\n4. Justice (fair distribution of resources)"
        };
        actions = ["Generate Outline", "Cite Sources"];
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        replyText = `Hello ${fullName}! ???? I'm your Academent AI Tutor. I can help explain difficult concepts, summarize lectures, or generate study guides and quizzes for you. What are we studying today?`;
      }
      
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: replyText,
        details,
        actions
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  // Click handler for study material action buttons
  const handleMaterialAction = (materialName, action) => {
    switchToTab('ai-tutor');
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      handleSendMessage(`${action} my study material: "${materialName}"`);
    }, 500);
  };

  // Mock Upload function
  const handleUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const ext = file.name.split('.').pop().toLowerCase();
        let icon = "edit_note";
        let iconColor = "bg-purple-100 text-purple-600";
        let btn1 = "Summarize";
        let btn2 = "Flashcards";
        
        if (ext === 'pdf') {
          icon = "picture_as_pdf";
          iconColor = "bg-blue-100 text-blue-600";
          btn1 = "Summarize";
          btn2 = "Generate Quiz";
        } else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
          icon = "slideshow";
          iconColor = "bg-orange-100 text-orange-600";
          btn1 = "Review Outline";
          btn2 = "Ask Video";
        }
        
        const newMaterial = {
          id: Date.now(),
          name: file.name,
          info: `Uploaded just now ??? ${(file.size / 1024 / 1024).toFixed(1)} MB`,
          icon,
          iconColor,
          btn1,
          btn2
        };
        
        setMaterials(prev => [newMaterial, ...prev]);
      }
    };
    fileInput.click();
  };

  // Mock New Note function
  const handleNewNote = () => {
    const noteName = prompt("Enter note title:");
    if (noteName) {
      const finalName = noteName.endsWith('.txt') || noteName.endsWith('.docx') ? noteName : `${noteName}.docx`;
      const newMaterial = {
        id: Date.now(),
        name: finalName,
        info: "Created just now ??? 0 words",
        icon: "edit_note",
        iconColor: "bg-purple-100 text-purple-600",
        btn1: "Summarize",
        btn2: "Flashcards"
      };
      setMaterials(prev => [newMaterial, ...prev]);
    }
  };

  if (loading) {
    return (
      <LoadingEffect
        variant="full"
        icon="dashboard"
        title="Loading dashboard"
        message="Gathering your study stats, materials, and daily plan."
      />
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
  const photoURL = currentUser?.photoURL || profile?.photoURL || "";

  // Derived progress values
  const targetHours = parseInt(weeklyHours.split('-')[1]) || parseInt(weeklyHours.replace('+', '')) || 20;
  const studiedHours = Math.round(targetHours * 0.75 * 10) / 10;
  const percentage = 75;
  const strokeDashoffset = 339.29 - (339.29 * percentage) / 100;

  // Academic Analytics values
  const averageGpa = "3.72";
  const gpaProgress = "+0.12";
  const weeklyStudyHours = `${studiedHours}h`;
  const quizAccuracy = "88%";
  const completedWork = "24/30";

  const sidebarItems = dashboardWindowItems;


  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex relative overflow-hidden h-screen">
      
      {/* Backdrop for Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
        />
      )}

      {/* Left Sidebar (SideNavBar) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={switchToTab}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        profile={profile}
        onLogout={handleLogout}
        onNewNote={handleNewNote}
        items={sidebarItems}
        isHidden={isSidebarHidden}
        onToggleHidden={() => setIsSidebarHidden(true)}
      />

      {isSidebarHidden && (
        <button
          type="button"
          onClick={() => setIsSidebarHidden(false)}
          className="hidden md:flex fixed left-4 top-4 z-[60] w-11 h-11 items-center justify-center rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-primary shadow-lg hover:bg-surface-container-high transition-colors"
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <span className="material-symbols-outlined text-[22px]">left_panel_open</span>
        </button>
      )}

      {/* Main Content Scroll Area */}
      <div className={`flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar transition-[padding] duration-300 ${isSidebarHidden ? 'md:pl-0' : 'md:pl-64'}`}>
        
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant/20 py-md px-gutter z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <span className="font-headline-md text-primary font-black text-base leading-none">Academent AI</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-sm hover:bg-surface-container rounded-lg text-primary transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-2xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </header>

        {activeTab === 'home' ? (
          <main className="p-gutter md:p-margin-desktop space-y-xl">
            {/* Top Navigation Row */}
            <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search notes, topics, or AI chat..." />

            {/* Welcome Hero Section */}
            <section className="ai-gradient rounded-xl p-xl relative overflow-hidden text-white flex flex-col md:flex-row justify-between items-stretch md:items-center min-h-[220px] gap-lg">
              <div className="z-10 max-w-lg space-y-md flex-1">
                <h2 className="font-display-lg text-headline-lg md:text-display-lg">Good Morning, {fullName.split(' ')[0]} ????</h2>
                <p className="font-body-lg text-body-lg opacity-90">
                  You're on a <span className="font-bold text-tertiary-fixed">12-day study streak</span>. You're just 4 sessions away from your weekly goal.
                </p>
                <div className="flex flex-wrap gap-md pt-md">
                  <button 
                    onClick={() => {
                      alert("Resuming Physics Problem Set #4...");
                    }}
                    className="px-xl py-md bg-white text-primary font-label-md text-label-md rounded-xl hover:bg-surface-container-low active:scale-95 transition-all shadow-md"
                  >
                    Continue Learning
                  </button>
                  <button 
                    onClick={() => switchToTab('ai-tutor')}
                    className="px-xl py-md bg-white/20 backdrop-blur-md border border-white/20 font-label-md text-label-md rounded-xl hover:bg-white/30 active:scale-95 transition-all"
                  >
                    Ask AI Tutor
                  </button>
                </div>
              </div>
              <div className="relative md:absolute md:right-0 md:top-0 md:bottom-0 w-full md:w-1/3 flex items-center justify-center md:justify-end pr-0 md:pr-xl overflow-visible h-48 md:h-auto">
                <img 
                  alt="AI Character Illustration" 
                  className="w-auto h-full max-h-[240px] md:max-h-none object-contain transform translate-y-0 md:translate-y-4 md:translate-x-6 lg:translate-x-12 md:scale-125 pointer-events-none" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfuLkyuYdDdGqUTAfc7f3WsJGCNH3KPT_exeRdeR1xYKRMY-Jll0gxZMYPF0cx8L_k28ETpl9RBKx-tQDGTo6PajwIHQw0wQ8fLsjSub2P1B1dn2yoBhvdBWdBIvra_xE6pZsDPTLsgfnT3OlFxj9qge85tfKa49X9wmYzlZJpE5IWJR4mgW2wf3ZF9FYq0W3xCJKGggs7LqGQl3IA_1BaQ9521_jKvgboXT-y0tAzeMPZX156drkTE1QlbG9zZsB--bixU8gGAVk"
                />
              </div>
              {/* Background Decoration */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/30 blur-[120px] rounded-full pointer-events-none"></div>
              <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-primary/20 blur-[150px] rounded-full pointer-events-none"></div>
            </section>

            {/* Stats Quick Look */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg">
              <div className="glass-panel p-lg rounded-xl flex items-center gap-md">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-label-sm text-label-sm text-outline truncate">Streak</p>
                  <h3 className="font-headline-md text-headline-md truncate">12 Days</h3>
                </div>
              </div>
              <div className="glass-panel p-lg rounded-xl flex items-center gap-md">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-label-sm text-label-sm text-outline truncate">Notes Created</p>
                  <h3 className="font-headline-md text-headline-md truncate">{materials.filter(m => m.icon === 'edit_note').length + 139}</h3>
                </div>
              </div>
              <div className="glass-panel p-lg rounded-xl flex items-center gap-md">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-label-sm text-label-sm text-outline truncate">Quizzes Taken</p>
                  <h3 className="font-headline-md text-headline-md truncate">28</h3>
                </div>
              </div>
              <div className="glass-panel p-lg rounded-xl flex items-center gap-md">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-label-sm text-label-sm text-outline truncate">GPA Progress</p>
                  <h3 className="font-headline-md text-headline-md truncate">+0.12</h3>
                </div>
              </div>
            </div>

            {/* Central AI Assistant & Study Plan / Right Sidebar Stack */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-lg items-start">
              
              {/* Left/Middle Column (AI Assistant Panel and Tasks) */}
              <div className="col-span-1 xl:col-span-8 space-y-lg">
                
                {/* AI Assistant Panel */}
                <div className="glass-panel rounded-xl flex flex-col h-[520px] overflow-hidden">
                  <div className="p-lg border-b border-outline-variant/10 flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-full ai-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                        AI
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md">Academent AI Tutor</h4>
                        <p className="text-xs text-green-500 flex items-center gap-xs mt-[2px]">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-sm">
                      <button 
                        onClick={() => {
                          if (confirm("Clear chat history?")) {
                            setMessages([
                              {
                                id: Date.now(),
                                sender: 'ai',
                                text: `Hello ${fullName}! How can I help you study today?`
                              }
                            ]);
                          }
                        }}
                        title="Clear History"
                        className="p-sm hover:bg-surface-container rounded-lg text-outline hover:text-primary transition-colors flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">history</span>
                      </button>
                      <button className="p-sm hover:bg-surface-container rounded-lg text-outline hover:text-primary transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-lg space-y-xl custom-scrollbar bg-surface-container-lowest/20">
                    {messages.map(msg => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-md max-w-[85%] ${
                          msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          msg.avatar ? (
                            <img className="w-8 h-8 rounded-full object-cover shrink-0" src={msg.avatar} alt="User" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                          )
                        ) : (
                          <div className="w-8 h-8 rounded-full ai-gradient flex items-center justify-center shrink-0 text-white text-[10px] font-bold">
                            AI
                          </div>
                        )}
                        
                        <div className={`p-lg rounded-xl shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-surface-container-low text-on-surface rounded-tr-none' 
                            : 'ai-gradient text-white rounded-tl-none shadow-primary/10'
                        } space-y-md`}>
                          <p className="text-body-md leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          
                          {/* Inner detail box for AI response if exists */}
                          {msg.details && (
                            <div className="bg-white/10 p-md rounded-lg border border-white/10">
                              <p className="font-bold mb-xs text-sm">{msg.details.title}</p>
                              <p className="text-sm opacity-90 whitespace-pre-wrap">{msg.details.content}</p>
                            </div>
                          )}

                          {/* Action chips for AI response */}
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="flex flex-wrap gap-sm pt-sm">
                              {msg.actions.map((act, i) => (
                                <button 
                                  key={i}
                                  onClick={() => handleSendMessage(act)}
                                  className="px-md py-sm bg-white/20 rounded-full text-xs hover:bg-white/30 active:scale-95 transition-all font-semibold"
                                >
                                  {act}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex gap-md max-w-[85%]">
                        <div className="w-8 h-8 rounded-full ai-gradient flex items-center justify-center shrink-0 text-white text-[10px] font-bold">
                          AI
                        </div>
                        <div className="ai-gradient text-white p-md rounded-xl rounded-tl-none shadow-sm shadow-primary/10 flex items-center gap-xs">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input area */}
                  <div className="p-lg bg-surface-container-lowest/50 border-t border-outline-variant/10">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="relative"
                    >
                      <input 
                        className="w-full pl-lg pr-xxl py-xl bg-white border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-body-md shadow-sm text-body-md" 
                        placeholder="Ask anything about your studies..." 
                        type="text" 
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                      />
                      <button 
                        type="submit"
                        className="absolute right-md top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg ai-gradient text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Today's Tasks & Subject Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  {/* Tasks List */}
                  <div className="glass-panel p-lg rounded-xl flex flex-col min-h-[360px]">
                    <div className="flex items-center justify-between mb-lg">
                      <h4 className="font-headline-md text-lg font-bold text-primary">Today's Tasks</h4>
                      <span 
                        onClick={() => alert("Task Manager coming soon!")}
                        className="text-primary font-label-md text-label-sm cursor-pointer hover:underline"
                      >
                        See all
                      </span>
                    </div>
                    <div className="space-y-md flex-1 overflow-y-auto custom-scrollbar max-h-[220px] pr-xs">
                      {tasks.map(task => (
                        <div 
                          key={task.id} 
                          className={`group p-md bg-surface-container-lowest border border-outline-variant/20 rounded-xl transition-all cursor-pointer ${
                            task.borderHover
                          } ${task.completed ? 'opacity-60' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-sm">
                            <span className={`px-sm py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${task.tagColor}`}>
                              {task.tag}
                            </span>
                            <button
                              onClick={() => toggleTaskCompleted(task.id)}
                              className="p-0 border-none bg-transparent hover:scale-105 active:scale-90 transition-transform flex items-center justify-center text-outline group-hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: task.completed ? "'FILL' 1" : "'FILL' 0" }}>
                                {task.completed ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                            </button>
                          </div>
                          <h5 className={`font-label-md text-label-md mb-xs transition-colors ${
                            task.completed ? 'line-through text-outline' : ''
                          }`}>
                            {task.title}
                          </h5>
                          <p className="text-xs text-outline mb-md">{task.due}</p>
                          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                            <div className={`${task.barColor} h-full transition-all duration-350`} style={{ width: `${task.progress}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={handleAddTask}
                      className="w-full py-md mt-lg border-2 border-dashed border-outline-variant/40 rounded-xl text-outline hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-sm font-label-md text-label-md hover:bg-primary/5 active:scale-95"
                    >
                      <span className="material-symbols-outlined">add</span>
                      Add Task
                    </button>
                  </div>

                  {/* Enrolled Subjects & Goals summary */}
                  <div className="glass-panel p-lg rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-headline-md text-lg font-bold text-primary mb-md">Academic Path</h4>
                      <p className="font-label-sm text-outline mb-xs">Major</p>
                      <p className="font-label-md text-on-surface font-black mb-md truncate capitalize">{major}</p>
                      
                      <p className="font-label-sm text-outline mb-xs">Enrolled Subjects</p>
                      <div className="flex flex-wrap gap-xs mb-md max-h-[120px] overflow-y-auto custom-scrollbar">
                        {subjects.map((sub, idx) => (
                          <span 
                            key={idx}
                            className="px-sm py-1 bg-surface-container text-primary font-bold text-[11px] rounded-lg border border-outline-variant/20 hover:border-primary/45 transition-colors cursor-default"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-md border-t border-outline-variant/10">
                      <p className="font-label-sm text-outline mb-xs">Study Method</p>
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-secondary text-xl">psychology</span>
                        <span className="font-label-md text-on-surface font-semibold capitalize">{studyStyle} Adaptive Style</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (Productivity, Goals, Exam Countdowns) - Stacks at bottom on small screens, sidebar on xl */}
              <div className="col-span-1 xl:col-span-4 space-y-lg">
                
                {/* Circular Goal Progress */}
                <div className="glass-panel p-lg rounded-xl text-center flex flex-col items-center">
                  <h5 className="font-label-md text-label-md mb-lg text-on-surface-variant">Weekly Goal Progress</h5>
                  <div className="relative inline-flex items-center justify-center mb-md">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle className="text-surface-container-high" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="12"></circle>
                      <circle 
                        className="text-primary transition-all duration-700" 
                        cx="64" 
                        cy="64" 
                        fill="transparent" 
                        r="54" 
                        stroke="currentColor" 
                        strokeDasharray="339.29" 
                        strokeDashoffset={strokeDashoffset} 
                        strokeWidth="12"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-primary">{percentage}%</span>
                      <span className="text-[10px] text-outline uppercase font-semibold">Done</span>
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    {studiedHours} / {targetHours} hours studied
                  </p>
                </div>

                {/* Productivity Score */}
                <div className="glass-panel p-lg rounded-xl ai-gradient text-white relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-md relative z-10">
                    <h5 className="font-label-md text-label-md opacity-80">Productivity Score</h5>
                    <span className="material-symbols-outlined text-tertiary-fixed animate-pulse">bolt</span>
                  </div>
                  <h3 className="font-display-lg text-4xl font-extrabold mb-sm relative z-10">92</h3>
                  <p className="text-xs opacity-75 relative z-10 leading-relaxed">
                    Your focus is 12% higher than last week. Keep it up!
                  </p>
                  {/* Decorative backgrounds */}
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full transition-transform group-hover:scale-125"></div>
                </div>

                {/* Exam Countdowns */}
                <div className="glass-panel p-lg rounded-xl flex flex-col">
                  <h5 className="font-label-md text-label-md mb-md text-on-surface-variant">Exam Countdown</h5>
                  <div className="space-y-md">
                    <div className="p-md bg-surface-container-low rounded-xl flex items-center justify-between group hover:bg-surface-container-high transition-colors cursor-pointer">
                      <div className="flex gap-md items-center overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-white flex flex-col items-center justify-center shadow-sm shrink-0 border border-outline-variant/15">
                          <span className="text-[9px] font-bold text-error uppercase leading-tight">OCT</span>
                          <span className="text-lg font-black leading-none text-on-surface">24</span>
                        </div>
                        <div className="overflow-hidden">
                          <h6 className="font-label-md text-label-md truncate">Midterm: Calculus II</h6>
                          <p className="text-xs text-outline truncate">Section 4A ??? 10:00 AM</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline group-hover:text-primary shrink-0">chevron_right</span>
                    </div>

                    <div className="p-md bg-surface-container-low rounded-xl flex items-center justify-between group hover:bg-surface-container-high transition-colors cursor-pointer">
                      <div className="flex gap-md items-center overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-white flex flex-col items-center justify-center shadow-sm shrink-0 border border-outline-variant/15">
                          <span className="text-[9px] font-bold text-primary uppercase leading-tight">NOV</span>
                          <span className="text-lg font-black leading-none text-on-surface">08</span>
                        </div>
                        <div className="overflow-hidden">
                          <h6 className="font-label-md text-label-md truncate">Biology Final Exam</h6>
                          <p className="text-xs text-outline truncate">Hall C ??? 02:30 PM</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline group-hover:text-primary shrink-0">chevron_right</span>
                    </div>
                  </div>
                </div>

                {/* Classroom Leaderboard */}
                <div className="glass-panel p-lg rounded-xl flex flex-col">
                  <h5 className="font-label-md text-label-md mb-md text-on-surface-variant">Classroom Leaderboard</h5>
                  <div className="space-y-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-md overflow-hidden">
                        <span className="font-bold text-outline text-xs w-4">1</span>
                        <img className="w-8 h-8 rounded-full object-cover shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3b96J4_qTZmvSlQNbr_A93zvT0vm8Yb2S7lDAFyrKSvgfe4PngkjYOOkfBq4YOciwg2JyevzztSeLS7saSujjTrX3kVUy4wVq2CYYe0QgLK3mPHJpSkDhb8wboYYx5Ya5S4UMxi0zstmcB9vIOODHwa50tNWNcMthRkJJwReCJky7m3CNLCDTHPlGfcqXzTOVHWzxQktt2KVCVFk7IvhAMbKrFHv8rYXd8Lo8doIWcdAarOxdu31yxSYLF-_60QBAoN4yld4AgyM" alt="1st Place" />
                        <span className="font-label-sm text-label-sm truncate">Sarah Jenkins</span>
                      </div>
                      <span className="font-bold text-xs text-primary shrink-0">12.4k XP</span>
                    </div>

                    <div className="flex items-center justify-between bg-primary/5 py-sm px-sm rounded-lg border border-primary/10">
                      <div className="flex items-center gap-md overflow-hidden">
                        <span className="font-bold text-primary text-xs w-4">2</span>
                        {photoURL ? (
                          <img className="w-8 h-8 rounded-full object-cover shrink-0 border border-primary/20" src={photoURL} alt="You" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-label-sm text-label-sm font-bold truncate text-primary">You</span>
                      </div>
                      <span className="font-bold text-xs text-primary shrink-0">10.8k XP</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-md overflow-hidden">
                        <span className="font-bold text-outline text-xs w-4">3</span>
                        <img className="w-8 h-8 rounded-full object-cover shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBe-3XzthoKUEe-toW0F0u5OAeqnwn24UcuCc-XjtJKlMuxLUG9ikcOeerg7d_yjxBNimlhr79NetZKsb-zmzbjMi6VVelPPbFvWgPpJntsawWeV-KHG-rJ8MaW0p3C5mlYXoJeFehXbCX7KhyC-UE3R9Dwwpl3098Dt9F5J8eEX0fTiWE-h0FukKwflvwpBJi_WCekiQpgOkhWwMr_v8-oKf6Ll_d_fGOBNCyCENgR-jrkk6Khn9hUV1pofTTd69hgePzmTbHlCd8" alt="3rd Place" />
                        <span className="font-label-sm text-label-sm truncate">Mike Ross</span>
                      </div>
                      <span className="font-bold text-xs text-primary shrink-0">9.5k XP</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Performance Analytics Section */}
            <section className="space-y-lg pt-4">
              <h4 className="font-headline-md text-headline-md text-primary font-bold">Academic Analytics</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg">
                <div className="glass-panel p-lg rounded-xl relative overflow-hidden group">
                  <p className="font-label-md text-label-sm text-outline mb-xs">Average GPA</p>
                  <h3 className="font-display-lg text-3xl font-extrabold text-primary">{averageGpa}</h3>
                  <div className="mt-md flex items-center gap-xs text-green-500 font-bold">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    <span className="text-xs">{gpaProgress} this term</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full transition-transform group-hover:scale-125"></div>
                </div>

                <div className="glass-panel p-lg rounded-xl relative overflow-hidden group">
                  <p className="font-label-md text-label-sm text-outline mb-xs">Weekly Study Hours</p>
                  <h3 className="font-display-lg text-3xl font-extrabold text-secondary">{weeklyStudyHours}</h3>
                  <div className="mt-md flex items-center gap-xs text-outline font-bold">
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    <span className="text-xs">Goal: {targetHours}h / week</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary/5 rounded-full transition-transform group-hover:scale-125"></div>
                </div>

                <div className="glass-panel p-lg rounded-xl relative overflow-hidden group">
                  <p className="font-label-md text-label-sm text-outline mb-xs">Quiz Accuracy</p>
                  <h3 className="font-display-lg text-3xl font-extrabold text-tertiary-container">{quizAccuracy}</h3>
                  <div className="mt-md flex items-center gap-xs text-orange-500 font-bold">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span className="text-xs">Top 5% of students</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-tertiary-fixed-dim/10 rounded-full transition-transform group-hover:scale-125"></div>
                </div>

                <div className="glass-panel p-lg rounded-xl relative overflow-hidden group">
                  <p className="font-label-md text-label-sm text-outline mb-xs">Completed Work</p>
                  <h3 className="font-display-lg text-3xl font-extrabold text-on-surface">{completedWork}</h3>
                  <div className="mt-md flex items-center gap-xs text-outline font-bold">
                    <span className="material-symbols-outlined text-[16px]">assignment</span>
                    <span className="text-xs">80% Assignment Rate</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-surface-container-highest rounded-full transition-transform group-hover:scale-125"></div>
                </div>
              </div>
            </section>

            {/* Notes & Materials Section */}
            <section className="space-y-lg pt-4 pb-8">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-md">
                <h4 className="font-headline-md text-headline-md text-primary font-bold">Recent Study Materials</h4>
                <div className="flex gap-sm">
                  <button 
                    onClick={handleUpload}
                    className="flex-1 sm:flex-initial px-md py-sm bg-surface-container-low text-primary rounded-lg text-label-md flex items-center justify-center gap-xs hover:bg-surface-container transition-colors font-bold text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">upload</span> Upload
                  </button>
                  <button 
                    onClick={handleNewNote}
                    className="flex-1 sm:flex-initial px-md py-sm bg-primary text-white rounded-lg text-label-md flex items-center justify-center gap-xs hover:opacity-90 active:scale-95 transition-all font-bold text-sm shadow-sm shadow-primary/10"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span> New Note
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                {materials.map((mat) => (
                  <div 
                    key={mat.id} 
                    className="glass-panel group p-lg rounded-xl hover:-translate-y-1 active:translate-y-0 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-md">
                        <div className={`w-12 h-12 ${mat.iconColor} rounded-lg flex items-center justify-center shrink-0 shadow-sm`}>
                          <span className="material-symbols-outlined text-[32px]">{mat.icon}</span>
                        </div>
                        <button className="p-xs text-outline opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </div>
                      <h5 className="font-label-md text-label-md mb-xs text-on-surface truncate">{mat.name}</h5>
                      <p className="text-xs text-outline mb-lg">{mat.info}</p>
                    </div>
                    <div className="flex gap-sm pt-2">
                      <button 
                        onClick={() => handleMaterialAction(mat.name, mat.btn1)}
                        className="flex-1 py-sm bg-surface-container-low rounded-lg text-xs font-bold text-primary hover:bg-primary/10 active:scale-95 transition-all"
                      >
                        {mat.btn1}
                      </button>
                      <button 
                        onClick={() => handleMaterialAction(mat.name, mat.btn2)}
                        className="flex-1 py-sm bg-surface-container-low rounded-lg text-xs font-bold text-primary hover:bg-primary/10 active:scale-95 transition-all"
                      >
                        {mat.btn2}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        ) : activeTab === 'my-notes' ? (
          <Suspense fallback={<LoadingEffect icon="folder_open" title="Loading notes" message="Opening your notes workspace." />}>
            <NotePage profile={profile} currentUser={currentUser} />
          </Suspense>
        ) : activeTab === 'ai-tutor' ? (
          <Suspense fallback={<LoadingEffect icon="psychology" title="Loading AI Tutor" message="Preparing your study companion." />}>
            <AITutorPage
              profile={profile}
              currentUser={currentUser}
              onOpenQuiz={(quizId) => {
                setQuizToOpenId(quizId);
                switchToTab('quiz-generator');
              }}
            />
          </Suspense>
        ) : activeTab === 'study-planner' ? (
          <Suspense fallback={<LoadingEffect icon="calendar_today" title="Loading planner" message="Opening your academic calendar." />}>
            <StudyPlannerPage profile={profile} currentUser={currentUser} />
          </Suspense>
        ) : activeTab === 'flashcards' ? (
          <Suspense fallback={<LoadingEffect icon="style" title="Loading flash cards" message="Preparing your study review workspace." />}>
            <FlashCardsPage profile={profile} currentUser={currentUser} />
          </Suspense>
        ) : activeTab === 'quiz-generator' ? (
          <Suspense fallback={<LoadingEffect icon="quiz" title="Loading quiz generator" message="Preparing quizzes and saved progress." />}>
            <QuizGeneratorPage
              profile={profile}
              currentUser={currentUser}
              initialQuizId={quizToOpenId}
              onInitialQuizOpened={() => setQuizToOpenId(null)}
            />
          </Suspense>
        ) : activeTab === 'analytics' ? (
          <Suspense fallback={<LoadingEffect icon="leaderboard" title="Loading analytics" message="Preparing your learning progress report." />}>
            <AnalyticsPage profile={profile} currentUser={currentUser} />
          </Suspense>
        ) : (
          /* Under Construction Panel for other Tabs */
          <main className="flex-1 flex items-center justify-center p-gutter md:p-margin-desktop min-h-[400px]">
            <div className="bg-white border border-outline-variant/30 p-lg md:p-xxl rounded-2xl shadow-sm text-center py-lg md:py-xxl max-w-lg mx-auto animate-fade-in-up">
              <span className="material-symbols-outlined text-6xl text-primary-fixed-dim mb-md animate-bounce">construction</span>
              <h3 className="font-headline-md text-on-surface font-bold mb-sm">Feature Under Construction</h3>
              <p className="font-body-md text-on-surface-variant mb-lg leading-relaxed">
                The onboarding is completed, and this view is prepared. The core study tools for the <span className="font-bold text-primary">
                  {sidebarItems.find(item => item.id === activeTab)?.label || activeTab}
                </span> tab are coming soon.
              </p>
              <button
                onClick={() => switchToTab('home')}
                className="px-lg py-md bg-primary text-white rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all"
              >
                Back to Home
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
