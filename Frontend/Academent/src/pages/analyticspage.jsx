import './analyticspage.css';

const summaryCards = [
  {
    label: 'Total Study Hours',
    value: '42.5h',
    change: '+12.4%',
    icon: 'schedule',
    tone: 'purple',
    helper: '8.5h above last week'
  },
  {
    label: 'Quizzes Completed',
    value: '18',
    change: '+6',
    icon: 'quiz',
    tone: 'gold',
    helper: '4 modules practiced'
  },
  {
    label: 'Average Quiz Score',
    value: '84%',
    change: '+7.2%',
    icon: 'workspace_premium',
    tone: 'emerald',
    helper: 'Best score in Biology'
  },
  {
    label: 'Tasks Completed',
    value: '31',
    change: '+18%',
    icon: 'task_alt',
    tone: 'rose',
    helper: '9 tasks this week'
  }
];

const studyBars = [
  { day: 'Mon', height: 46, hours: '3.0h' },
  { day: 'Tue', height: 68, hours: '4.6h' },
  { day: 'Wed', height: 52, hours: '3.4h' },
  { day: 'Thu', height: 78, hours: '5.1h' },
  { day: 'Fri', height: 62, hours: '4.0h' },
  { day: 'Sat', height: 88, hours: '5.8h' },
  { day: 'Sun', height: 74, hours: '4.9h' }
];

const subjectScores = [
  { subject: 'Biology', score: 91, color: '#06b6d4' },
  { subject: 'Physics', score: 76, color: '#8b5cf6' },
  { subject: 'Chemistry', score: 84, color: '#10b981' },
  { subject: 'Calculus', score: 69, color: '#f59e0b' }
];

const modules = [
  { name: 'Biology: Cell Structure', progress: 86, hours: '12.5h', score: '91%', accent: 'cyan' },
  { name: 'Physics: Kinematics', progress: 72, hours: '9.0h', score: '76%', accent: 'violet' },
  { name: 'Chemistry: Organic Basics', progress: 64, hours: '8.5h', score: '84%', accent: 'emerald' },
  { name: 'Calculus: Integration', progress: 48, hours: '6.0h', score: '69%', accent: 'amber' },
  { name: 'Study Skills: Exam Prep', progress: 58, hours: '4.5h', score: '78%', accent: 'rose' }
];

const plannerItems = [
  { type: 'Exam', title: 'Biology midterm', time: 'Today, 2:30 PM', status: 'today', icon: 'school' },
  { type: 'Assignment', title: 'Physics worksheet', time: 'Overdue by 1 day', status: 'overdue', icon: 'assignment_late' },
  { type: 'Study Session', title: 'Calculus practice set', time: 'Tomorrow, 7:00 PM', status: 'upcoming', icon: 'event_available' }
];

const aiInsights = [
  'You perform best in MCQ questions.',
  'Revise Module 02 before your next quiz.',
  'Your study consistency improved this week.'
];

const weakAreas = [
  { topic: 'Integration by Parts', score: '52%', action: 'Create flashcards', icon: 'style' },
  { topic: 'Newtonian Motion Graphs', score: '58%', action: 'Ask AI Tutor', icon: 'psychology' },
  { topic: 'Organic Reaction Mechanisms', score: '61%', action: 'Generate quiz', icon: 'quiz' }
];

const recentActivity = [
  { title: 'Uploaded notes', detail: 'Biology Chapter 04 PDF', time: '18 min ago', icon: 'upload_file' },
  { title: 'Generated quizzes', detail: '12 MCQs from Physics notes', time: '1h ago', icon: 'auto_awesome' },
  { title: 'Completed quiz', detail: 'Chemistry scored 84%', time: 'Yesterday', icon: 'verified' },
  { title: 'Scheduled study session', detail: 'Calculus revision block', time: 'Yesterday', icon: 'calendar_today' },
  { title: 'Asked AI Tutor', detail: 'Clarified cell membrane transport', time: '2 days ago', icon: 'forum' }
];

const calendarDays = [
  { date: '1' }, { date: '2' }, { date: '3', mark: 'study' }, { date: '4' },
  { date: '5', mark: 'today' }, { date: '6' }, { date: '7', mark: 'exam' },
  { date: '8' }, { date: '9', mark: 'study' }, { date: '10' }, { date: '11' },
  { date: '12', mark: 'assignment' }, { date: '13' }, { date: '14' }
];

function AnalyticsPage() {
  return (
    <main className="analytics-page">
      <section className="analytics-hero">
        <div className="analytics-hero__copy">
          <span className="analytics-kicker">Learning intelligence</span>
          <h1>Analytics</h1>
          <p>Track your learning progress and improve your study performance.</p>
        </div>

        <div className="analytics-hero__actions" aria-label="Analytics controls">
          <div className="analytics-range" role="group" aria-label="Date range">
            {['Today', 'This Week', 'This Month', 'Custom Range'].map((range) => (
              <button key={range} className={range === 'This Week' ? 'is-active' : ''} type="button">
                {range}
              </button>
            ))}
          </div>
          <button className="analytics-export" type="button">
            <span className="material-symbols-outlined">download</span>
            Export Report
          </button>
        </div>
      </section>

      <section className="analytics-summary" aria-label="Analytics summary">
        {summaryCards.map((card) => (
          <article className={`analytics-stat analytics-stat--${card.tone}`} key={card.label}>
            <div className="analytics-stat__icon">
              <span className="material-symbols-outlined">{card.icon}</span>
            </div>
            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
            </div>
            <span className="analytics-change">
              <span className="material-symbols-outlined">trending_up</span>
              {card.change}
            </span>
            <small>{card.helper}</small>
          </article>
        ))}
      </section>

      <section className="analytics-grid analytics-grid--charts">
        <article className="analytics-card analytics-card--wide">
          <div className="analytics-card__header">
            <div>
              <h2>Study Progress</h2>
              <p>Study time over the current week</p>
            </div>
            <div className="analytics-tabs" role="group" aria-label="Study progress filter">
              {['Daily', 'Weekly', 'Monthly'].map((tab) => (
                <button className={tab === 'Daily' ? 'is-active' : ''} key={tab} type="button">{tab}</button>
              ))}
            </div>
          </div>

          <div className="study-chart" aria-label="Bar chart of study time">
            {studyBars.map((bar) => (
              <div className="study-chart__item" key={bar.day}>
                <span className="study-chart__value">{bar.hours}</span>
                <div className="study-chart__track">
                  <span style={{ height: `${bar.height}%` }} />
                </div>
                <strong>{bar.day}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-card quiz-card">
          <div className="analytics-card__header">
            <div>
              <h2>Quiz Performance</h2>
              <p>Average marks by module</p>
            </div>
          </div>

          <div className="score-bars">
            {subjectScores.map((item) => (
              <div className="score-bars__row" key={item.subject}>
                <div>
                  <span>{item.subject}</span>
                  <strong>{item.score}%</strong>
                </div>
                <div className="score-bars__track">
                  <span style={{ width: `${item.score}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="quiz-status">
            <div><strong>18</strong><span>Completed</span></div>
            <div><strong>5</strong><span>Partial</span></div>
            <div><strong>3</strong><span>Not attempted</span></div>
          </div>

          <div className="difficulty-badges" aria-label="Quiz difficulty badges">
            <span className="easy">Easy</span>
            <span className="medium">Medium</span>
            <span className="hard">Hard</span>
          </div>
        </article>
      </section>

      <section className="analytics-card">
        <div className="analytics-card__header">
          <div>
            <h2>Subject / Module Progress</h2>
            <p>How each learning area is moving forward</p>
          </div>
        </div>
        <div className="module-grid">
          {modules.map((module) => (
            <article className={`module-card module-card--${module.accent}`} key={module.name}>
              <div>
                <h3>{module.name}</h3>
                <span>{module.progress}%</span>
              </div>
              <div className="module-meta">
                <span>{module.hours} studied</span>
                <span>{module.score} avg score</span>
              </div>
              <div className="module-progress">
                <span style={{ width: `${module.progress}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="analytics-grid analytics-grid--balanced">
        <article className="analytics-card planner-card">
          <div className="analytics-card__header">
            <div>
              <h2>Study Planner Insights</h2>
              <p>Upcoming exams, assignments, and sessions</p>
            </div>
          </div>

          <div className="planner-layout">
            <div className="planner-list">
              {plannerItems.map((item) => (
                <div className={`planner-item planner-item--${item.status}`} key={item.title}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.type} - {item.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mini-calendar" aria-label="Mini calendar preview">
              <div className="mini-calendar__header">
                <strong>July</strong>
                <span>Plan</span>
              </div>
              <div className="mini-calendar__grid">
                {calendarDays.map((day) => (
                  <span className={day.mark ? `is-${day.mark}` : ''} key={day.date}>{day.date}</span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="analytics-card ai-insight-card">
          <div className="ai-insight-card__avatar">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div>
            <span className="analytics-kicker">AI Learning Insights</span>
            <h2>Personalized next steps</h2>
          </div>
          <div className="ai-suggestions">
            {aiInsights.map((insight) => (
              <div key={insight}>
                <span className="material-symbols-outlined">auto_awesome</span>
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="analytics-grid analytics-grid--recommendations">
        <article className="analytics-card weak-card">
          <div className="analytics-card__header">
            <div>
              <h2>Weak Areas & Recommendations</h2>
              <p>Topics that need a focused review</p>
            </div>
          </div>
          <div className="weak-list">
            {weakAreas.map((area) => (
              <div className="weak-item" key={area.topic}>
                <div>
                  <strong>{area.topic}</strong>
                  <span>{area.score} recent score</span>
                </div>
                <button type="button">
                  <span className="material-symbols-outlined">{area.icon}</span>
                  {area.action}
                </button>
              </div>
            ))}
          </div>
          <div className="recommendation-actions">
            {[
              ['article', 'Review notes'],
              ['quiz', 'Generate quiz'],
              ['psychology', 'Ask AI Tutor'],
              ['style', 'Create flashcards']
            ].map(([icon, label]) => (
              <button type="button" key={label}>
                <span className="material-symbols-outlined">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </article>

        <article className="analytics-card activity-card">
          <div className="analytics-card__header">
            <div>
              <h2>Recent Activity</h2>
              <p>Your latest learning actions</p>
            </div>
          </div>
          <div className="activity-timeline">
            {recentActivity.map((activity) => (
              <div className="activity-item" key={`${activity.title}-${activity.time}`}>
                <span className="activity-item__icon material-symbols-outlined">{activity.icon}</span>
                <div>
                  <strong>{activity.title}</strong>
                  <p>{activity.detail}</p>
                </div>
                <time>{activity.time}</time>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="analytics-grid analytics-grid--states">
        <article className="analytics-card empty-state">
          <span className="material-symbols-outlined">insights</span>
          <div>
            <h2>No analytics data yet</h2>
            <p>Upload notes, complete quizzes, or schedule a study session to start building your learning report.</p>
          </div>
          <button type="button">Start studying</button>
        </article>

        <article className="analytics-card loading-state" aria-label="Loading state preview">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton-grid">
            <span className="skeleton skeleton-box" />
            <span className="skeleton skeleton-box" />
            <span className="skeleton skeleton-box" />
          </div>
        </article>
      </section>
    </main>
  );
}

export default AnalyticsPage;
