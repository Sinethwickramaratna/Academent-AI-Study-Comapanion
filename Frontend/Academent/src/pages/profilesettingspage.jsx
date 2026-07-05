import './profilesettingspage.css';

const subjectOptions = [
  'Biology',
  'Physics',
  'Chemistry',
  'Calculus',
  'Academic Writing',
  'Research Methods'
];

const learningStyles = ['Visual', 'Reading', 'Practice-based', 'Mixed'];
const difficultyLevels = ['Easy', 'Medium', 'Hard', 'Adaptive'];
const themeModes = ['Light', 'Dark', 'System'];

const notificationSettings = [
  { label: 'Quiz reminders', enabled: true },
  { label: 'Study plan reminders', enabled: true },
  { label: 'Assignment deadline alerts', enabled: true },
  { label: 'AI tutor updates', enabled: false }
];

const accentColors = [
  { label: 'Primary purple', value: '#4D2B8C' },
  { label: 'Secondary purple', value: '#85409D' },
  { label: 'Accent yellow', value: '#EEA727' },
  { label: 'Highlight yellow', value: '#FFEF5F' }
];

const summaryStats = [
  { label: 'Completed quizzes', value: '18', icon: 'quiz', trend: '+6 this month', tone: 'purple', chart: [42, 62, 54, 78, 70] },
  { label: 'Study streak', value: '12 days', icon: 'local_fire_department', trend: 'Best: 18 days', tone: 'gold', chart: [40, 52, 64, 72, 88] },
  { label: 'Uploaded notes', value: '36', icon: 'description', trend: '8 PDFs added', tone: 'violet', chart: [50, 46, 68, 58, 76] },
  { label: 'Average quiz score', value: '84%', icon: 'workspace_premium', trend: '+7.2%', tone: 'emerald', chart: [48, 58, 66, 72, 84] }
];

function ProfileSettingsPage({ profile, currentUser }) {
  const fullName = profile?.fullName || currentUser?.displayName || 'Ariana Patel';
  const email = profile?.email || currentUser?.email || 'ariana.patel@northbridge.edu';
  const photoURL = currentUser?.photoURL || profile?.photoURL || '';
  const firstName = fullName.split(' ')[0] || 'Ariana';
  const role = profile?.role || 'Student';
  const major = profile?.academicProfile?.major || 'BSc Data Science';
  const semester = profile?.academicProfile?.semester || 'Semester 4';
  const university = profile?.academicProfile?.university || 'Northbridge University';
  const subjects = profile?.academicProfile?.subjects?.length ? profile.academicProfile.subjects : subjectOptions.slice(0, 4);
  const emailVerified = Boolean(currentUser?.emailVerified || profile?.emailVerified);
  const googleLinked = Boolean(currentUser?.providerData?.some((provider) => provider.providerId === 'google.com'));
  const completion = 82;

  return (
    <main className="profile-settings-page">
      <section className="profile-hero">
        <div className="profile-hero__copy">
          <span className="profile-kicker">Student workspace</span>
          <h1>Profile & Settings</h1>
          <p>Manage your personal information, preferences, and account settings.</p>
        </div>

        <div className="profile-completion-card" aria-label="Profile completion">
          <div className="profile-completion-card__ring" style={{ '--completion': `${completion}%` }}>
            <span>{completion}%</span>
          </div>
          <div>
            <strong>Profile completion</strong>
            <p>2 quick updates left</p>
          </div>
        </div>
      </section>

      <div className="profile-layout">
        <div className="profile-main">
          <section className="profile-card profile-overview-card">
            <div className="profile-avatar-area">
              {photoURL ? (
                <img className="profile-avatar" src={photoURL} alt="Student profile" />
              ) : (
                <div className="profile-avatar profile-avatar--initials">{fullName.charAt(0).toUpperCase()}</div>
              )}
              <button className="profile-avatar-button" type="button">
                <span className="material-symbols-outlined">photo_camera</span>
                Change photo
              </button>
            </div>

            <div className="profile-overview-content">
              <span className="profile-status-pill">
                <span className="material-symbols-outlined">school</span>
                Active student
              </span>
              <h2>{fullName}</h2>
              <p>{email}</p>
              <div className="profile-meta-grid">
                <span>{role}</span>
                <span>{major}</span>
                <span>{semester}</span>
              </div>
              <div className="profile-progress">
                <div>
                  <strong>{completion}% complete</strong>
                  <span>Academic preferences and phone number can be refined.</span>
                </div>
                <div className="profile-progress__track">
                  <span style={{ width: `${completion}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-section-header">
              <div>
                <h2>Personal Information</h2>
                <p>Keep your academic identity and contact details up to date.</p>
              </div>
              <span className="profile-section-icon material-symbols-outlined">badge</span>
            </div>

            <div className="profile-form-grid">
              <label className="profile-field">
                <span>Full Name</span>
                <input type="text" defaultValue={fullName} />
              </label>
              <label className="profile-field">
                <span>Email Address</span>
                <input type="email" defaultValue={email} />
              </label>
              <label className="profile-field">
                <span>Phone Number</span>
                <input type="tel" defaultValue="+1 (415) 276-8942" />
              </label>
              <label className="profile-field">
                <span>University / School</span>
                <input type="text" defaultValue={university} />
              </label>
              <label className="profile-field">
                <span>Degree Program</span>
                <input type="text" defaultValue={major} />
              </label>
              <label className="profile-field">
                <span>Current Semester</span>
                <select defaultValue={semester}>
                  <option>Semester 3</option>
                  <option>Semester 4</option>
                  <option>Semester 5</option>
                </select>
              </label>
              <label className="profile-field">
                <span>Academic Year</span>
                <select defaultValue="2026 / 2027">
                  <option>2025 / 2026</option>
                  <option>2026 / 2027</option>
                  <option>2027 / 2028</option>
                </select>
              </label>
            </div>

            <div className="profile-actions">
              <button className="profile-button profile-button--primary" type="button">
                <span className="material-symbols-outlined">save</span>
                Save Changes
              </button>
              <button className="profile-button profile-button--ghost" type="button">Cancel</button>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-section-header">
              <div>
                <h2>Academic Preferences</h2>
                <p>Tune Academent AI around how you like to study.</p>
              </div>
              <span className="profile-section-icon material-symbols-outlined">psychology</span>
            </div>

            <div className="subject-chip-grid" aria-label="Selected subjects and modules">
              {subjectOptions.map((subject) => (
                <button className={subjects.includes(subject) ? 'is-selected' : ''} type="button" key={subject}>
                  <span className="material-symbols-outlined">{subjects.includes(subject) ? 'check_circle' : 'add_circle'}</span>
                  {subject}
                </button>
              ))}
            </div>

            <div className="profile-form-grid profile-form-grid--compact">
              <label className="profile-field profile-field--wide">
                <span>Study Goal</span>
                <input type="text" defaultValue="Raise average quiz score above 88% before finals" />
              </label>
              <label className="profile-field">
                <span>Preferred Study Time</span>
                <select defaultValue="Evening, 7:00 PM - 10:00 PM">
                  <option>Morning, 6:00 AM - 9:00 AM</option>
                  <option>Afternoon, 1:00 PM - 4:00 PM</option>
                  <option>Evening, 7:00 PM - 10:00 PM</option>
                </select>
              </label>
            </div>

            <div className="profile-choice-row">
              <div>
                <h3>Learning Style</h3>
                <div className="profile-segmented" role="group" aria-label="Learning style">
                  {learningStyles.map((style) => (
                    <button className={style === 'Mixed' ? 'is-active' : ''} type="button" key={style}>{style}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3>Difficulty Preference</h3>
                <div className="profile-segmented" role="group" aria-label="Difficulty preference">
                  {difficultyLevels.map((level) => (
                    <button className={level === 'Adaptive' ? 'is-active' : ''} type="button" key={level}>{level}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-section-header">
              <div>
                <h2>Account Settings</h2>
                <p>Review login security, connected accounts, and account actions.</p>
              </div>
              <span className="profile-section-icon material-symbols-outlined">admin_panel_settings</span>
            </div>

            <div className="account-settings-list">
              <div className="account-setting-row">
                <span className="material-symbols-outlined">lock_reset</span>
                <div>
                  <strong>Password</strong>
                  <p>Last changed 42 days ago</p>
                </div>
                <button type="button">Change password</button>
              </div>
              <div className="account-setting-row">
                <span className="material-symbols-outlined">mark_email_read</span>
                <div>
                  <strong>Email verification</strong>
                  <p>{emailVerified ? 'Verified and ready for account recovery' : 'Verification is still pending'}</p>
                </div>
                <span className={`profile-badge ${emailVerified ? 'is-success' : 'is-warning'}`}>
                  {emailVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="account-setting-row">
                <span className="material-symbols-outlined">account_circle</span>
                <div>
                  <strong>Google account</strong>
                  <p>{googleLinked ? 'Connected for quick sign in' : 'Not connected yet'}</p>
                </div>
                <span className={`profile-badge ${googleLinked ? 'is-success' : ''}`}>{googleLinked ? 'Linked' : 'Optional'}</span>
              </div>
              <div className="account-setting-row">
                <span className="material-symbols-outlined">encrypted</span>
                <div>
                  <strong>Two-factor authentication</strong>
                  <p>Extra sign-in protection placeholder</p>
                </div>
                <span className="profile-badge">Coming soon</span>
              </div>
              <div className="account-setting-row account-setting-row--danger">
                <span className="material-symbols-outlined">delete</span>
                <div>
                  <strong>Delete account</strong>
                  <p>Permanently remove your profile, notes, and progress.</p>
                </div>
                <button type="button">Delete account</button>
              </div>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-section-header">
              <div>
                <h2>App Preferences</h2>
                <p>Set your dashboard theme, reminders, language, and accent color.</p>
              </div>
              <span className="profile-section-icon material-symbols-outlined">tune</span>
            </div>

            <div className="profile-preference-grid">
              <div>
                <h3>Theme Mode</h3>
                <div className="theme-selector">
                  {themeModes.map((mode) => (
                    <button className={mode === 'Light' ? 'is-active' : ''} type="button" key={mode}>
                      <span className="material-symbols-outlined">{mode === 'Light' ? 'light_mode' : mode === 'Dark' ? 'dark_mode' : 'computer'}</span>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <label className="profile-field">
                <span>Language</span>
                <select defaultValue="English (US)">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Sinhala</option>
                  <option>Tamil</option>
                </select>
              </label>
            </div>

            <div className="notification-grid">
              {notificationSettings.map((item) => (
                <label className="notification-toggle" key={item.label}>
                  <span>{item.label}</span>
                  <input type="checkbox" defaultChecked={item.enabled} />
                  <i />
                </label>
              ))}
            </div>

            <div className="accent-selector" aria-label="Accent color selector">
              {accentColors.map((color, index) => (
                <button className={index === 0 ? 'is-active' : ''} type="button" key={color.label} title={color.label}>
                  <span style={{ backgroundColor: color.value }} />
                </button>
              ))}
            </div>
          </section>

          <section className="profile-card privacy-card">
            <div className="profile-section-header">
              <div>
                <h2>Privacy & Data</h2>
                <p>Control study data, uploaded materials, and AI conversation history.</p>
              </div>
              <span className="profile-section-icon material-symbols-outlined">policy</span>
            </div>

            <div className="privacy-actions">
              <button type="button">
                <span className="material-symbols-outlined">download</span>
                Export my data
              </button>
              <button type="button">
                <span className="material-symbols-outlined">folder_managed</span>
                Manage uploaded notes/PDFs
              </button>
              <button className="is-danger" type="button">
                <span className="material-symbols-outlined">delete_sweep</span>
                Clear AI chat history
              </button>
            </div>

            <div className="privacy-notice">
              <span className="material-symbols-outlined">verified_user</span>
              <div>
                <strong>Your study data stays private to your account.</strong>
                <p>Academent uses your notes, quiz history, and preferences to personalize recommendations and does not expose uploaded materials to other students.</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="profile-summary-sidebar" aria-label="Profile summary">
          <section className="profile-side-card profile-side-card--welcome">
            <span className="profile-kicker">Today</span>
            <h2>Nice progress, {firstName}</h2>
            <p>Your profile is aligned with this semester's study plan.</p>
          </section>

          {summaryStats.map((stat) => (
            <article className={`profile-side-card mini-stat mini-stat--${stat.tone}`} key={stat.label}>
              <div className="mini-stat__header">
                <span className="material-symbols-outlined">{stat.icon}</span>
                <small>{stat.trend}</small>
              </div>
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
              <div className="mini-sparkline" aria-hidden="true">
                {stat.chart.map((height, index) => (
                  <span style={{ height: `${height}%` }} key={`${stat.label}-${index}`} />
                ))}
              </div>
            </article>
          ))}
        </aside>
      </div>
    </main>
  );
}

export default ProfileSettingsPage;
