import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './profilesettingspage.css';
import { useAuth } from '../context/AuthContext';
import {
  deleteCurrentUserAccount,
  getFriendlyAuthError,
  resendEmailVerification,
  resetPassword,
  updateCurrentUserAuthProfile,
  updateUserProfileData,
} from '../Services/authService';
import { uploadProfilePhotoToCloudinary } from '../Services/profilePhotoService';
import { deleteAllTutorConversations } from '../Services/aiTutorService';
import { applyThemeMode, storeThemeMode } from '../utils/theme';

const subjectOptions = [
  'Biology',
  'Physics',
  'Chemistry',
  'Calculus',
  'Academic Writing',
  'Research Methods',
  'Mathematics',
  'Computer Science',
  'Software Engineering',
  'Data Science',
];

const learningStyles = ['Visual', 'Reading', 'Practice-based', 'Interactive', 'Mixed'];
const difficultyLevels = ['Easy', 'Medium', 'Hard', 'Adaptive'];
const themeModes = ['Light', 'Dark', 'System'];

const semesterOptionsBase = [
  '',
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8',
];

const academicYearOptionsBase = [
  '',
  '2025 / 2026',
  '2026 / 2027',
  '2027 / 2028',
  'Freshman (Year 1)',
  'Sophomore (Year 2)',
  'Junior (Year 3)',
  'Senior (Year 4)',
  'Postgraduate',
];

const studyTimeOptions = [
  '',
  'Morning, 6:00 AM - 9:00 AM',
  'Afternoon, 1:00 PM - 4:00 PM',
  'Evening, 7:00 PM - 10:00 PM',
  'Flexible schedule',
];

const languageOptions = ['English (US)', 'English (UK)', 'Sinhala', 'Tamil'];

const notificationSettings = [
  { key: 'quizReminders', label: 'Quiz reminders', defaultEnabled: true },
  { key: 'studyPlanReminders', label: 'Study plan reminders', defaultEnabled: true },
  { key: 'assignmentDeadlineAlerts', label: 'Assignment deadline alerts', defaultEnabled: true },
  { key: 'aiTutorUpdates', label: 'AI tutor updates', defaultEnabled: false },
];

const accentColors = [
  { label: 'Primary purple', value: '#7B5CFF' },
  { label: 'Secondary purple', value: '#A178FF' },
  { label: 'Accent gold', value: '#F2B544' },
  { label: 'Highlight yellow', value: '#FFE873' },
];

const normalizeAccentColor = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  const legacyAccentMap = {
    '#4D2B8C': '#7B5CFF',
    '#85409D': '#A178FF',
    '#EEA727': '#F2B544',
    '#FFEF5F': '#FFE873',
  };
  const migratedValue = legacyAccentMap[normalized] || normalized;
  return accentColors.some((color) => color.value.toUpperCase() === migratedValue) ? migratedValue : accentColors[0].value;
};

const summaryStats = [
  { label: 'Completed quizzes', value: '18', icon: 'quiz', trend: '+6 this month', tone: 'purple', chart: [42, 62, 54, 78, 70] },
  { label: 'Study streak', value: '12 days', icon: 'local_fire_department', trend: 'Best: 18 days', tone: 'gold', chart: [40, 52, 64, 72, 88] },
  { label: 'Uploaded notes', value: '36', icon: 'description', trend: '8 PDFs added', tone: 'violet', chart: [50, 46, 68, 58, 76] },
  { label: 'Average quiz score', value: '84%', icon: 'workspace_premium', trend: '+7.2%', tone: 'emerald', chart: [48, 58, 66, 72, 84] },
];

const notificationDefaults = notificationSettings.reduce((settings, item) => ({
  ...settings,
  [item.key]: item.defaultEnabled,
}), {});

const uniqueOptions = (options) => [...new Set(options.filter((option) => option !== undefined && option !== null))];

const normalizeLearningStyle = (value) => {
  const normalized = String(value || '').toLowerCase();
  const styleMap = {
    visual: 'Visual',
    reading: 'Reading',
    practice: 'Practice-based',
    practice_based: 'Practice-based',
    'practice-based': 'Practice-based',
    interactive: 'Interactive',
    mixed: 'Mixed',
  };

  return learningStyles.includes(value) ? value : styleMap[normalized] || 'Mixed';
};

const getInitialForm = (profile, currentUser) => {
  const academicProfile = profile?.academicProfile || {};
  const learningPreferences = profile?.learningPreferences || {};
  const appPreferences = profile?.appPreferences || {};
  const notifications = appPreferences.notifications || {};

  return {
    fullName: profile?.fullName || currentUser?.displayName || '',
    email: profile?.email || currentUser?.email || '',
    phoneNumber: profile?.phoneNumber || '',
    university: academicProfile.university || '',
    degree: academicProfile.degree || '',
    major: academicProfile.major || '',
    semester: academicProfile.semester || '',
    academicYear: academicProfile.academicYear || '',
    subjects: Array.isArray(academicProfile.subjects) ? academicProfile.subjects : [],
    studyGoal: learningPreferences.studyGoal || '',
    preferredStudyTime: learningPreferences.preferredStudyTime || '',
    learningStyle: normalizeLearningStyle(learningPreferences.studyStyle),
    difficultyPreference: learningPreferences.difficultyPreference || 'Adaptive',
    themeMode: appPreferences.themeMode || 'Light',
    language: appPreferences.language || academicProfile.language || 'English (US)',
    notifications: { ...notificationDefaults, ...notifications },
    accentColor: normalizeAccentColor(appPreferences.accentColor),
    photoURL: profile?.photoURL || currentUser?.photoURL || '',
    photoPublicId: profile?.photoPublicId || '',
  };
};

const buildProfileSettingsPayload = ({ form, profile, currentUser, email, emailVerified }) => {
  const trimmedName = form.fullName.trim();
  const academicProfile = {
    ...(profile?.academicProfile || {}),
    university: form.university.trim(),
    degree: form.degree.trim(),
    major: form.major.trim(),
    semester: form.semester,
    academicYear: form.academicYear,
    language: form.language,
    subjects: form.subjects,
  };
  const learningPreferences = {
    ...(profile?.learningPreferences || {}),
    studyGoal: form.studyGoal.trim(),
    preferredStudyTime: form.preferredStudyTime,
    studyStyle: form.learningStyle,
    difficultyPreference: form.difficultyPreference,
  };
  const appPreferences = {
    ...(profile?.appPreferences || {}),
    themeMode: form.themeMode,
    language: form.language,
    accentColor: form.accentColor,
    notifications: form.notifications,
  };
  const personalSettings = {
    fullName: trimmedName,
    email,
    phoneNumber: form.phoneNumber.trim(),
    photoURL: form.photoURL || '',
    photoPublicId: form.photoPublicId || '',
    emailVerified,
  };

  return {
    uid: currentUser?.uid || profile?.uid || '',
    ...personalSettings,
    academicProfile,
    learningPreferences,
    appPreferences,
    userSettings: {
      personal: personalSettings,
      academic: academicProfile,
      learning: learningPreferences,
      app: appPreferences,
    },
  };
};

const buildAppPreferences = ({ form, profile }) => ({
  ...(profile?.appPreferences || {}),
  themeMode: form.themeMode || 'Light',
  language: form.language || 'English (US)',
  accentColor: normalizeAccentColor(form.accentColor),
  notifications: { ...notificationDefaults, ...(form.notifications || {}) },
});

const getAppPreferencesFingerprint = (form) => JSON.stringify({
  themeMode: form.themeMode || 'Light',
  language: form.language || 'English (US)',
  accentColor: normalizeAccentColor(form.accentColor),
  notifications: { ...notificationDefaults, ...(form.notifications || {}) },
});

const safeStringify = (value) => JSON.stringify(value, (key, item) => {
  if (item && typeof item.toDate === 'function') {
    return item.toDate().toISOString();
  }
  return item;
}, 2);

const toRoleLabel = (role) => {
  const label = String(role || 'Student').replace(/[-_]+/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function ProfileSettingsPage({ profile, currentUser, onProfileUpdated }) {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(() => getInitialForm(profile, currentUser));
  const latestFormRef = useRef(form);
  const latestProfileRef = useRef(profile);
  const appPreferencesTimerRef = useRef(null);
  const appPreferencesSaveInFlightRef = useRef(false);
  const appPreferencesSaveQueuedRef = useRef(false);
  const skipNextProfileFormSyncRef = useRef(false);
  const lastSavedAppPreferencesRef = useRef(getAppPreferencesFingerprint(form));
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingAppPreferences, setSavingAppPreferences] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [clearingChats, setClearingChats] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    latestFormRef.current = form;
  }, [form]);

  useEffect(() => {
    latestProfileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    const nextForm = getInitialForm(profile, currentUser);
    const nextAppPreferencesFingerprint = getAppPreferencesFingerprint(nextForm);

    if (skipNextProfileFormSyncRef.current) {
      skipNextProfileFormSyncRef.current = false;
      lastSavedAppPreferencesRef.current = nextAppPreferencesFingerprint;
      return undefined;
    }

    const timer = window.setTimeout(() => {
      lastSavedAppPreferencesRef.current = nextAppPreferencesFingerprint;
      setForm(nextForm);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [profile, currentUser]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const semesterOptions = useMemo(() => uniqueOptions([...semesterOptionsBase, form.semester]), [form.semester]);
  const academicYearOptions = useMemo(() => uniqueOptions([...academicYearOptionsBase, form.academicYear]), [form.academicYear]);

  const fullName = form.fullName.trim() || 'Student';
  const firstName = fullName.split(' ')[0] || 'Student';
  const email = form.email || currentUser?.email || '';
  const role = toRoleLabel(profile?.role);
  const major = form.major || form.degree || 'Undeclared program';
  const semester = form.semester || 'Semester not set';
  const university = form.university || 'University not set';
  const emailVerified = Boolean(currentUser?.emailVerified || profile?.emailVerified);
  const googleLinked = Boolean(currentUser?.providerData?.some((provider) => provider.providerId === 'google.com'));
  const busy = saving || uploadingPhoto || sendingPasswordReset || sendingVerification || clearingChats || deletingAccount;

  const completionItems = [
    form.fullName,
    email,
    form.photoURL,
    form.phoneNumber,
    form.university,
    form.degree || form.major,
    form.semester,
    form.academicYear,
    form.subjects.length ? 'subjects' : '',
    form.studyGoal,
  ];
  const completedItems = completionItems.filter((item) => Boolean(String(item).trim())).length;
  const completion = Math.round((completedItems / completionItems.length) * 100);
  const updatesLeft = Math.max(completionItems.length - completedItems, 0);

  const showNotice = useCallback((type, message) => setNotice({ type, message }), []);
  const appPreferencesFingerprint = useMemo(() => getAppPreferencesFingerprint(form), [
    form.accentColor,
    form.language,
    form.notifications,
    form.themeMode,
  ]);

  const persistLatestAppPreferences = useCallback(async () => {
    if (!currentUser?.uid) return;

    if (appPreferencesSaveInFlightRef.current) {
      appPreferencesSaveQueuedRef.current = true;
      return;
    }

    const formSnapshot = latestFormRef.current;
    const appPreferencesFingerprint = getAppPreferencesFingerprint(formSnapshot);

    if (appPreferencesFingerprint === lastSavedAppPreferencesRef.current) {
      setSavingAppPreferences(false);
      return;
    }

    appPreferencesSaveInFlightRef.current = true;
    appPreferencesSaveQueuedRef.current = false;
    setSavingAppPreferences(true);

    try {
      const profileSnapshot = latestProfileRef.current;
      const appPreferences = buildAppPreferences({ form: formSnapshot, profile: profileSnapshot });
      const nextProfile = {
        ...(profileSnapshot || {}),
        appPreferences,
        userSettings: {
          ...(profileSnapshot?.userSettings || {}),
          app: appPreferences,
        },
      };

      await updateUserProfileData({
        appPreferences,
        userSettings: {
          app: appPreferences,
        },
      });

      lastSavedAppPreferencesRef.current = appPreferencesFingerprint;
      if (onProfileUpdated) {
        skipNextProfileFormSyncRef.current = true;
        onProfileUpdated(nextProfile);
      }
    } catch (error) {
      showNotice('error', getFriendlyAuthError(error));
    } finally {
      appPreferencesSaveInFlightRef.current = false;

      const latestFingerprint = getAppPreferencesFingerprint(latestFormRef.current);
      const shouldSaveQueuedChange = appPreferencesSaveQueuedRef.current
        || latestFingerprint !== lastSavedAppPreferencesRef.current;
      appPreferencesSaveQueuedRef.current = false;

      if (shouldSaveQueuedChange) {
        window.clearTimeout(appPreferencesTimerRef.current);
        appPreferencesTimerRef.current = window.setTimeout(() => {
          persistLatestAppPreferences();
        }, 300);
      } else {
        setSavingAppPreferences(false);
      }
    }
  }, [currentUser?.uid, onProfileUpdated, showNotice]);

  useEffect(() => {
    if (!currentUser?.uid) return undefined;

    if (appPreferencesFingerprint === lastSavedAppPreferencesRef.current) {
      return undefined;
    }

    if (appPreferencesSaveInFlightRef.current) {
      appPreferencesSaveQueuedRef.current = true;
      return undefined;
    }

    window.clearTimeout(appPreferencesTimerRef.current);
    appPreferencesTimerRef.current = window.setTimeout(() => {
      persistLatestAppPreferences();
    }, 500);

    return () => window.clearTimeout(appPreferencesTimerRef.current);
  }, [appPreferencesFingerprint, currentUser?.uid, persistLatestAppPreferences]);

  useEffect(() => () => window.clearTimeout(appPreferencesTimerRef.current), []);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleThemeModeChange = (mode) => {
    setField('themeMode', mode);
    storeThemeMode(mode);
    applyThemeMode(mode);
  };

  const refreshSharedProfile = async (fallbackProfile) => {
    const refreshedProfile = await refreshProfile(currentUser?.uid);
    onProfileUpdated?.(refreshedProfile || fallbackProfile);
    return refreshedProfile || fallbackProfile;
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotice('error', 'Choose an image file for your profile photo.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotice('error', 'Profile photo must be 5 MB or smaller.');
      return;
    }

    if (!currentUser?.uid) {
      showNotice('error', 'You must be signed in to update your photo.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const uploadedPhoto = await uploadProfilePhotoToCloudinary(file);
      const photoPatch = {
        photoURL: uploadedPhoto.url,
        photoPublicId: uploadedPhoto.publicId,
        photoStorageProvider: uploadedPhoto.storageProvider,
        userSettings: {
          personal: {
            photoURL: uploadedPhoto.url,
            photoPublicId: uploadedPhoto.publicId,
          },
        },
      };
      const nextForm = {
        ...form,
        photoURL: uploadedPhoto.url,
        photoPublicId: uploadedPhoto.publicId,
      };

      await updateUserProfileData(photoPatch);
      await updateCurrentUserAuthProfile({ photoURL: uploadedPhoto.url });
      setForm(nextForm);
      await refreshSharedProfile({ ...profile, ...photoPatch });
      showNotice('success', 'Profile photo uploaded and saved.');
    } catch (error) {
      showNotice('error', getFriendlyAuthError(error));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.uid) {
      showNotice('error', 'You must be signed in to save profile settings.');
      return;
    }

    const trimmedName = form.fullName.trim();
    if (!trimmedName) {
      showNotice('error', 'Full name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildProfileSettingsPayload({ form, profile, currentUser, email, emailVerified });

      await updateUserProfileData(payload);
      await updateCurrentUserAuthProfile({
        displayName: trimmedName,
        ...(form.photoURL ? { photoURL: form.photoURL } : {}),
      });
      await refreshSharedProfile({ ...profile, ...payload });
      showNotice('success', 'Profile settings saved.');
    } catch (error) {
      showNotice('error', getFriendlyAuthError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(getInitialForm(profile, currentUser));
    showNotice('info', 'Unsaved changes were reset.');
  };

  const toggleSubject = (subject) => {
    setForm((current) => ({
      ...current,
      subjects: current.subjects.includes(subject)
        ? current.subjects.filter((item) => item !== subject)
        : [...current.subjects, subject],
    }));
  };

  const toggleNotification = (key) => {
    setForm((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [key]: !current.notifications[key],
      },
    }));
  };

  const handlePasswordReset = async () => {
    if (!email) {
      showNotice('error', 'No email address is available for password reset.');
      return;
    }

    setSendingPasswordReset(true);
    try {
      await resetPassword(email);
      showNotice('success', `Password reset instructions were sent to ${email}.`);
    } catch (error) {
      showNotice('error', getFriendlyAuthError(error));
    } finally {
      setSendingPasswordReset(false);
    }
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      await resendEmailVerification();
      showNotice('success', `Verification email sent to ${email}.`);
    } catch (error) {
      showNotice('error', getFriendlyAuthError(error));
    } finally {
      setSendingVerification(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      authUser: {
        uid: currentUser?.uid || '',
        email: currentUser?.email || '',
        displayName: currentUser?.displayName || '',
        photoURL: currentUser?.photoURL || '',
        emailVerified: Boolean(currentUser?.emailVerified),
      },
      firestoreProfile: profile || {},
      currentSettingsDraft: form,
    };

    const blob = new Blob([safeStringify(exportPayload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `academent-profile-${currentUser?.uid || 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showNotice('success', 'Profile data export started.');
  };

  const handleClearChatHistory = async () => {
    if (!currentUser?.uid) {
      showNotice('error', 'You must be signed in to clear chat history.');
      return;
    }

    const confirmed = window.confirm('Clear all AI Tutor conversations and messages? This cannot be undone.');
    if (!confirmed) return;

    setClearingChats(true);
    try {
      const deletedCount = await deleteAllTutorConversations(currentUser.uid);
      showNotice('success', `${deletedCount} AI Tutor conversation${deletedCount === 1 ? '' : 's'} cleared.`);
    } catch (error) {
      showNotice('error', error.message || 'Could not clear AI Tutor history.');
    } finally {
      setClearingChats(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your Academent account and known study data? This action cannot be undone.');
    if (!confirmed) return;

    const confirmationText = window.prompt('Type DELETE to confirm permanent account deletion.');
    if (confirmationText !== 'DELETE') {
      showNotice('info', 'Account deletion cancelled.');
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteCurrentUserAccount();
      navigate('/login', { replace: true });
    } catch (error) {
      showNotice('error', getFriendlyAuthError(error));
      setDeletingAccount(false);
    }
  };

  const pageClassName = `profile-settings-page profile-settings-page--${form.themeMode.toLowerCase()}`;

  return (
    <main className={pageClassName} style={{ '--profile-accent': form.accentColor }}>
      <input
        ref={fileInputRef}
        className="profile-hidden-file"
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
      />

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
            <p>{updatesLeft ? `${updatesLeft} update${updatesLeft === 1 ? '' : 's'} left` : 'All key details are set'}</p>
          </div>
        </div>
      </section>

      {notice && (
        <div className={`profile-toast profile-toast--${notice.type}`} role="status" aria-live="polite">
          <span className="material-symbols-outlined">
            {notice.type === 'success' ? 'check_circle' : notice.type === 'error' ? 'error' : 'info'}
          </span>
          {notice.message}
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-main">
          <section className="profile-card profile-overview-card">
            <div className="profile-avatar-area">
              {form.photoURL ? (
                <img className="profile-avatar" src={form.photoURL} alt="Student profile" />
              ) : (
                <div className="profile-avatar profile-avatar--initials">{fullName.charAt(0).toUpperCase()}</div>
              )}
              <button
                className="profile-avatar-button"
                type="button"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-symbols-outlined">{uploadingPhoto ? 'sync' : 'photo_camera'}</span>
                {uploadingPhoto ? 'Uploading...' : 'Change photo'}
              </button>
            </div>

            <div className="profile-overview-content">
              <span className="profile-status-pill">
                <span className="material-symbols-outlined">school</span>
                Active student
              </span>
              <h2>{fullName}</h2>
              <p>{email || 'Email not available'}</p>
              <div className="profile-meta-grid">
                <span>{role}</span>
                <span>{major}</span>
                <span>{semester}</span>
              </div>
              <div className="profile-progress">
                <div>
                  <strong>{completion}% complete</strong>
                  <span>{updatesLeft ? 'Add the missing details to improve personalization.' : 'Your profile has the essentials for personalization.'}</span>
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
                <input type="text" value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} />
              </label>
              <label className="profile-field">
                <span>Email Address</span>
                <input type="email" value={email} readOnly />
              </label>
              <label className="profile-field">
                <span>Phone Number</span>
                <input type="tel" value={form.phoneNumber} onChange={(event) => setField('phoneNumber', event.target.value)} placeholder="Add your contact number" />
              </label>
              <label className="profile-field">
                <span>University / School</span>
                <input type="text" value={form.university} onChange={(event) => setField('university', event.target.value)} placeholder="Your university or school" />
              </label>
              <label className="profile-field">
                <span>Degree Program</span>
                <input type="text" value={form.degree || form.major} onChange={(event) => setField('degree', event.target.value)} placeholder="e.g. Bachelor of Science" />
              </label>
              <label className="profile-field">
                <span>Current Semester</span>
                <select value={form.semester} onChange={(event) => setField('semester', event.target.value)}>
                  {semesterOptions.map((option) => <option value={option} key={option || 'empty-semester'}>{option || 'Select semester'}</option>)}
                </select>
              </label>
              <label className="profile-field">
                <span>Academic Year</span>
                <select value={form.academicYear} onChange={(event) => setField('academicYear', event.target.value)}>
                  {academicYearOptions.map((option) => <option value={option} key={option || 'empty-year'}>{option || 'Select academic year'}</option>)}
                </select>
              </label>
            </div>

            <div className="profile-actions">
              <button className="profile-button profile-button--primary" type="button" disabled={busy} onClick={handleSaveProfile}>
                <span className="material-symbols-outlined">{saving ? 'sync' : 'save'}</span>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="profile-button profile-button--ghost" type="button" disabled={busy} onClick={handleCancel}>Cancel</button>
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
                <button
                  className={form.subjects.includes(subject) ? 'is-selected' : ''}
                  type="button"
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                >
                  <span className="material-symbols-outlined">{form.subjects.includes(subject) ? 'check_circle' : 'add_circle'}</span>
                  {subject}
                </button>
              ))}
            </div>

            <div className="profile-form-grid profile-form-grid--compact">
              <label className="profile-field profile-field--wide">
                <span>Study Goal</span>
                <input type="text" value={form.studyGoal} onChange={(event) => setField('studyGoal', event.target.value)} placeholder="e.g. Raise quiz score before finals" />
              </label>
              <label className="profile-field">
                <span>Preferred Study Time</span>
                <select value={form.preferredStudyTime} onChange={(event) => setField('preferredStudyTime', event.target.value)}>
                  {studyTimeOptions.map((option) => <option value={option} key={option || 'empty-study-time'}>{option || 'Choose a study time'}</option>)}
                </select>
              </label>
            </div>

            <div className="profile-choice-row">
              <div>
                <h3>Learning Style</h3>
                <div className="profile-segmented" role="group" aria-label="Learning style">
                  {learningStyles.map((style) => (
                    <button className={style === form.learningStyle ? 'is-active' : ''} type="button" key={style} onClick={() => setField('learningStyle', style)}>{style}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3>Difficulty Preference</h3>
                <div className="profile-segmented" role="group" aria-label="Difficulty preference">
                  {difficultyLevels.map((level) => (
                    <button className={level === form.difficultyPreference ? 'is-active' : ''} type="button" key={level} onClick={() => setField('difficultyPreference', level)}>{level}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="profile-actions profile-actions--section">
              <button className="profile-button profile-button--primary" type="button" disabled={busy} onClick={handleSaveProfile}>
                <span className="material-symbols-outlined">{saving ? 'sync' : 'save'}</span>
                {saving ? 'Saving...' : 'Save academic settings'}
              </button>
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
                  <p>Send a reset link to your account email.</p>
                </div>
                <button type="button" disabled={sendingPasswordReset} onClick={handlePasswordReset}>{sendingPasswordReset ? 'Sending...' : 'Change password'}</button>
              </div>
              <div className="account-setting-row">
                <span className="material-symbols-outlined">mark_email_read</span>
                <div>
                  <strong>Email verification</strong>
                  <p>{emailVerified ? 'Verified and ready for account recovery' : 'Verification is still pending'}</p>
                </div>
                {emailVerified ? (
                  <span className="profile-badge is-success">Verified</span>
                ) : (
                  <button type="button" disabled={sendingVerification} onClick={handleResendVerification}>{sendingVerification ? 'Sending...' : 'Send link'}</button>
                )}
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
                <button type="button" disabled={deletingAccount} onClick={handleDeleteAccount}>{deletingAccount ? 'Deleting...' : 'Delete account'}</button>
              </div>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-section-header">
              <div>
                <h2>App Preferences</h2>
                <p>Set your dashboard theme, reminders, language, and accent color.</p>
              </div>
              {savingAppPreferences && <span className="profile-badge">Saving...</span>}
              <span className="profile-section-icon material-symbols-outlined">tune</span>
            </div>

            <div className="profile-preference-grid">
              <div>
                <h3>Theme Mode</h3>
                <div className="theme-selector">
                  {themeModes.map((mode) => (
                    <button className={mode === form.themeMode ? 'is-active' : ''} type="button" key={mode} onClick={() => handleThemeModeChange(mode)}>
                      <span className="material-symbols-outlined">{mode === 'Light' ? 'light_mode' : mode === 'Dark' ? 'dark_mode' : 'computer'}</span>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <label className="profile-field">
                <span>Language</span>
                <select value={form.language} onChange={(event) => setField('language', event.target.value)}>
                  {languageOptions.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <div className="notification-grid">
              {notificationSettings.map((item) => (
                <label className="notification-toggle" key={item.key}>
                  <span>{item.label}</span>
                  <input type="checkbox" checked={Boolean(form.notifications[item.key])} onChange={() => toggleNotification(item.key)} />
                  <i />
                </label>
              ))}
            </div>

            <div className="accent-selector" aria-label="Accent color selector">
              {accentColors.map((color) => (
                <button className={color.value === form.accentColor ? 'is-active' : ''} type="button" key={color.label} title={color.label} onClick={() => setField('accentColor', color.value)}>
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
              <button type="button" onClick={handleExportData}>
                <span className="material-symbols-outlined">download</span>
                Export my data
              </button>
              <button type="button" onClick={() => navigate('/my-notes')}>
                <span className="material-symbols-outlined">folder_managed</span>
                Manage uploaded notes/PDFs
              </button>
              <button className="is-danger" type="button" disabled={clearingChats} onClick={handleClearChatHistory}>
                <span className="material-symbols-outlined">delete_sweep</span>
                {clearingChats ? 'Clearing...' : 'Clear AI chat history'}
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
            <p>{university === 'University not set' ? 'Finish your profile to tune recommendations.' : `Your profile is aligned with ${university}.`}</p>
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
