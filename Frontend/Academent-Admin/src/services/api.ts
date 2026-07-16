import type {
  ActivityItem,
  AdminMember,
  AuditLog,
  BarDatum,
  ChartSeries,
  Issue,
  Metric,
  Report,
  SettingSection,
  SystemHealth,
  SystemLog,
  UserSummary,
} from '../types/admin'

export interface DashboardSnapshot {
  metrics: Metric[]
  userGrowth: ChartSeries[]
  activeUsers: BarDatum[]
  aiRequests: BarDatum[]
  errors: ChartSeries[]
  featureUsage: BarDatum[]
  incidents: ActivityItem[]
  registrations: ActivityItem[]
  adminActions: ActivityItem[]
  health: SystemHealth[]
}

const metrics: Metric[] = [
  { label: 'Total users', value: '28,430', change: '+8.2% this month', tone: 'good', icon: 'users' },
  { label: 'Active today', value: '5,812', change: '+312 since yesterday', tone: 'good', icon: 'activity' },
  { label: 'New users', value: '842', change: '+14.7% in range', tone: 'good', icon: 'plus' },
  { label: 'Suspended accounts', value: '37', change: '5 pending review', tone: 'warning', icon: 'shield' },
  { label: 'AI Tutor requests', value: '164k', change: '+22.1% in range', tone: 'neutral', icon: 'spark' },
  { label: 'Generated quizzes', value: '18,904', change: '+3,110 this week', tone: 'good', icon: 'quiz' },
  { label: 'Generated flashcards', value: '64,209', change: '+9.6% in range', tone: 'good', icon: 'cards' },
  { label: 'Uploaded notes', value: '91,782', change: '2.1 TB stored', tone: 'neutral', icon: 'file' },
  { label: 'Open issues', value: '19', change: '4 critical paths', tone: 'warning', icon: 'alert' },
  { label: 'Critical errors', value: '7', change: '-3 after deploy', tone: 'danger', icon: 'error' },
  { label: 'Failed notifications', value: '183', change: '1.3% delivery loss', tone: 'warning', icon: 'bell' },
  { label: 'API usage', value: '72%', change: 'Gemini quota forecast', tone: 'neutral', icon: 'server' },
]

const health: SystemHealth[] = [
  { service: 'Firebase Auth', status: 'Operational', latency: '118 ms', uptime: '99.99%', detail: 'Admin and student sessions stable' },
  { service: 'Firestore', status: 'Operational', latency: '74 ms', uptime: '99.98%', detail: 'Indexes healthy, writes normal' },
  { service: 'Backend API', status: 'Degraded', latency: '246 ms', uptime: '99.91%', detail: 'Quiz queue is recovering' },
  { service: 'Gemini API', status: 'Operational', latency: '612 ms', uptime: '99.95%', detail: 'Model gateway within quota' },
  { service: 'Cloudinary', status: 'Operational', latency: '185 ms', uptime: '99.97%', detail: 'PDF and avatar uploads stable' },
  { service: 'Notifications', status: 'Investigating', latency: '390 ms', uptime: '99.82%', detail: 'Push retries elevated on Android' },
]

const incidents: ActivityItem[] = [
  { title: 'Notification retry rate elevated', description: 'Android push channel retries crossed warning threshold.', time: '12 min ago', tone: 'warning' },
  { title: 'Quiz generation queue recovered', description: 'Workers cleared 92% of the delayed requests.', time: '38 min ago', tone: 'good' },
  { title: 'Cloudinary upload validation patched', description: 'Unsupported HEIC files now fail with a clear message.', time: '1 hr ago', tone: 'neutral' },
]

const registrations: ActivityItem[] = [
  { title: 'Maya Fernando', description: 'Registered from Colombo Science Academy.', time: '4 min ago', tone: 'good' },
  { title: 'Rohan Mehta', description: 'Completed onboarding and uploaded 3 note sets.', time: '11 min ago', tone: 'good' },
  { title: 'Aisha Perera', description: 'Signed up with Google and enabled reminders.', time: '19 min ago', tone: 'neutral' },
]

const adminActions: ActivityItem[] = [
  { title: 'N. Silva suspended account', description: 'Reason: repeated policy violations on AI prompts.', time: '7 min ago', tone: 'warning' },
  { title: 'A. Kumar changed role', description: 'Promoted support reviewer to Content Admin.', time: '26 min ago', tone: 'neutral' },
  { title: 'S. Jay enabled maintenance banner', description: 'Scheduled for Friday 02:00 UTC.', time: '42 min ago', tone: 'neutral' },
]

export const users: UserSummary[] = [
  {
    id: 'usr_10084',
    avatar: 'MF',
    fullName: 'Maya Fernando',
    email: 'maya.fernando@example.com',
    status: 'Active',
    role: 'Student',
    registrationDate: '2026-06-02',
    lastLogin: '2026-07-16 20:12',
    studyActivity: '4 sessions today',
    aiUsage: 81,
    usageLevel: 'High',
    uploadedNotes: 128,
    quizzes: 42,
    flashcards: 318,
    reports: 0,
    devices: ['Chrome on Windows', 'Academent Android'],
  },
  {
    id: 'usr_10031',
    avatar: 'RM',
    fullName: 'Rohan Mehta',
    email: 'rohan.mehta@example.com',
    status: 'Active',
    role: 'Student',
    registrationDate: '2026-05-18',
    lastLogin: '2026-07-16 19:40',
    studyActivity: '12 reviews due',
    aiUsage: 54,
    usageLevel: 'Normal',
    uploadedNotes: 64,
    quizzes: 18,
    flashcards: 146,
    reports: 1,
    devices: ['Safari on iPad', 'Chrome on macOS'],
  },
  {
    id: 'usr_09972',
    avatar: 'AP',
    fullName: 'Aisha Perera',
    email: 'aisha.perera@example.com',
    status: 'Suspended',
    role: 'Student',
    registrationDate: '2026-04-29',
    lastLogin: '2026-07-12 08:31',
    studyActivity: 'Suspended',
    aiUsage: 96,
    usageLevel: 'Critical',
    uploadedNotes: 21,
    quizzes: 7,
    flashcards: 84,
    reports: 3,
    devices: ['Firefox on Windows'],
  },
  {
    id: 'usr_09883',
    avatar: 'DN',
    fullName: 'Dilan Nawarathna',
    email: 'dilan.n@example.com',
    status: 'Deletion pending',
    role: 'Student',
    registrationDate: '2026-03-10',
    lastLogin: '2026-07-01 16:08',
    studyActivity: 'Export requested',
    aiUsage: 17,
    usageLevel: 'Low',
    uploadedNotes: 8,
    quizzes: 2,
    flashcards: 41,
    reports: 0,
    devices: ['Edge on Windows'],
  },
  {
    id: 'adm_012',
    avatar: 'NS',
    fullName: 'Nadee Silva',
    email: 'nadee.silva@academent.ai',
    status: 'Active',
    role: 'Support Admin',
    registrationDate: '2026-01-12',
    lastLogin: '2026-07-16 18:02',
    studyActivity: 'Reviewed 11 reports',
    aiUsage: 9,
    usageLevel: 'Low',
    uploadedNotes: 0,
    quizzes: 0,
    flashcards: 0,
    reports: 0,
    devices: ['Chrome on Windows', 'Authenticator app'],
  },
  {
    id: 'usr_09741',
    avatar: 'CW',
    fullName: 'Chen Wei',
    email: 'chen.wei@example.com',
    status: 'Disabled',
    role: 'Student',
    registrationDate: '2026-02-01',
    lastLogin: '2026-05-27 11:21',
    studyActivity: 'Disabled',
    aiUsage: 33,
    usageLevel: 'Normal',
    uploadedNotes: 29,
    quizzes: 11,
    flashcards: 103,
    reports: 1,
    devices: ['Chrome on Android'],
  },
]

export const logs: SystemLog[] = [
  {
    id: 'log_7821',
    timestamp: '2026-07-16 20:18:02',
    level: 'Critical',
    service: 'Quiz API',
    message: 'Quiz generation worker exhausted retry budget for document chunk',
    user: 'usr_10084',
    requestId: 'req_9D21F',
    endpoint: '/api/quizzes/generate',
    statusCode: 503,
    resolved: false,
    stackTrace: 'QuizWorkerTimeoutError at generateQuiz -> createQuestionSet -> geminiGateway',
    metadata: 'region=asia-south1; queue=quiz-generation; retry=5',
    browser: 'Chrome 126 on Windows 11',
    relatedLogs: ['log_7819', 'log_7801'],
    firstOccurrence: '2026-07-16 19:42:11',
    latestOccurrence: '2026-07-16 20:18:02',
    occurrenceCount: 18,
    assignedTo: 'System Admin queue',
    notes: 'Watch queue depth before Friday exam traffic.',
  },
  {
    id: 'log_7814',
    timestamp: '2026-07-16 20:09:44',
    level: 'Error',
    service: 'Notifications',
    message: 'FCM token rejected during scheduled reminder send',
    user: 'usr_10031',
    requestId: 'req_FCM7A',
    endpoint: '/api/notifications/reminders/process',
    statusCode: 424,
    resolved: false,
    stackTrace: 'FirebaseMessagingError: registration-token-not-registered',
    metadata: 'channel=push; platform=android; reminder=batch-8',
    browser: 'Academent Android 2.4.1',
    relatedLogs: ['log_7808'],
    firstOccurrence: '2026-07-16 18:18:17',
    latestOccurrence: '2026-07-16 20:09:44',
    occurrenceCount: 42,
    assignedTo: 'Nadee Silva',
    notes: 'Likely stale device token. Backfill cleanup scheduled.',
  },
  {
    id: 'log_7799',
    timestamp: '2026-07-16 19:52:09',
    level: 'Warning',
    service: 'Cloudinary',
    message: 'PDF upload nearing per-user monthly storage limit',
    user: 'usr_10084',
    requestId: 'req_CLD2C',
    endpoint: '/api/notes/upload',
    statusCode: 202,
    resolved: true,
    stackTrace: 'No stack trace. Warning emitted from upload policy guard.',
    metadata: 'storageUsed=1.82GB; limit=2GB',
    browser: 'Chrome 126 on Windows 11',
    relatedLogs: [],
    firstOccurrence: '2026-07-16 19:52:09',
    latestOccurrence: '2026-07-16 19:52:09',
    occurrenceCount: 1,
    assignedTo: 'Content Admin queue',
    notes: 'User notified about limit.',
  },
  {
    id: 'log_7761',
    timestamp: '2026-07-16 18:27:33',
    level: 'Information',
    service: 'Auth',
    message: 'Admin MFA challenge completed',
    user: 'adm_012',
    requestId: 'req_AUTH2',
    endpoint: '/api/admin/auth/mfa',
    statusCode: 200,
    resolved: true,
    stackTrace: 'No stack trace for informational event.',
    metadata: 'method=totp; risk=low',
    browser: 'Chrome 126 on Windows 11',
    relatedLogs: [],
    firstOccurrence: '2026-07-16 18:27:33',
    latestOccurrence: '2026-07-16 18:27:33',
    occurrenceCount: 1,
    assignedTo: 'Read only',
    notes: 'Audit mirrored.',
  },
]

export const issues: Issue[] = [
  {
    id: 'iss_421',
    title: 'Quiz worker timeout on large PDFs',
    severity: 'Critical',
    feature: 'Quiz Generator',
    occurrences: 187,
    affectedUsers: 42,
    firstSeen: '2026-07-15 09:12',
    lastSeen: '2026-07-16 20:18',
    assignedAdmin: 'Sanjay Jay',
    status: 'Investigating',
    summary: 'Generation requests timeout when source documents exceed chunk merge limits.',
    graph: [8, 10, 12, 22, 34, 29, 41, 31],
    stackTrace: 'QuizWorkerTimeoutError at generateQuiz -> createQuestionSet -> geminiGateway',
    relatedRequests: ['req_9D21F', 'req_7A19Q', 'req_6B01Z'],
    browsers: [
      { label: 'Chrome', value: 58, color: '#4D2B8C' },
      { label: 'Safari', value: 23, color: '#85409D' },
      { label: 'Android', value: 19, color: '#EEA727' },
    ],
    discussion: [
      { title: 'Sanjay Jay', description: 'Added worker queue traces and raised Gemini timeout ceiling.', time: '24 min ago', tone: 'neutral' },
      { title: 'Nadee Silva', description: 'Support macro updated for affected student replies.', time: '1 hr ago', tone: 'good' },
    ],
    deploymentVersion: 'api-2026.07.16-rc3',
  },
  {
    id: 'iss_318',
    title: 'Reminder push tokens stale after app reinstall',
    severity: 'High',
    feature: 'Notifications',
    occurrences: 421,
    affectedUsers: 133,
    firstSeen: '2026-07-13 14:31',
    lastSeen: '2026-07-16 20:09',
    assignedAdmin: 'Nadee Silva',
    status: 'In progress',
    summary: 'Expired FCM tokens are retained after reinstall and trigger delivery failures.',
    graph: [21, 26, 44, 58, 73, 69, 80, 50],
    stackTrace: 'FirebaseMessagingError: registration-token-not-registered',
    relatedRequests: ['req_FCM7A', 'req_FCM2B'],
    browsers: [
      { label: 'Android', value: 76, color: '#EEA727' },
      { label: 'Chrome', value: 18, color: '#4D2B8C' },
      { label: 'Safari', value: 6, color: '#85409D' },
    ],
    discussion: [
      { title: 'Nadee Silva', description: 'Token cleanup job will run hourly after review.', time: '11 min ago', tone: 'neutral' },
    ],
    deploymentVersion: 'notifications-2026.07.15',
  },
  {
    id: 'iss_277',
    title: 'Flashcard import duplicates cards',
    severity: 'Medium',
    feature: 'Flashcards',
    occurrences: 44,
    affectedUsers: 16,
    firstSeen: '2026-07-10 08:05',
    lastSeen: '2026-07-15 22:10',
    assignedAdmin: 'Asha Kumar',
    status: 'Resolved',
    summary: 'Repeated save event created duplicate flashcards when network retries overlapped.',
    graph: [16, 11, 8, 5, 2, 1, 1, 0],
    stackTrace: 'DuplicateFlashcardError at saveDeck -> batchWrite',
    relatedRequests: ['req_CARD9'],
    browsers: [
      { label: 'Chrome', value: 65, color: '#4D2B8C' },
      { label: 'Safari', value: 35, color: '#85409D' },
    ],
    discussion: [
      { title: 'Asha Kumar', description: 'Idempotency key added to flashcard saves.', time: '1 day ago', tone: 'good' },
    ],
    deploymentVersion: 'web-2026.07.14',
  },
]

export const reports: Report[] = [
  {
    id: 'rep_9001',
    reporter: 'Maya Fernando',
    category: 'AI answer problem',
    priority: 'High',
    preview: 'The AI tutor gave a conflicting organic chemistry explanation.',
    submittedDate: '2026-07-16 18:32',
    assignedAdmin: 'Asha Kumar',
    status: 'Assigned',
    attachments: ['screenshot-ai-answer.png', 'conversation-export.json'],
    conversation: [
      { title: 'Maya Fernando', description: 'Submitted an answer quality report from AI Tutor.', time: '2 hr ago', tone: 'warning' },
      { title: 'Asha Kumar', description: 'Tagged for content review and model response audit.', time: '1 hr ago', tone: 'neutral' },
    ],
    notes: 'Check grounding context before replying.',
  },
  {
    id: 'rep_8995',
    reporter: 'Rohan Mehta',
    category: 'Bug report',
    priority: 'Medium',
    preview: 'Study planner reminders fire twice for Monday schedule.',
    submittedDate: '2026-07-16 13:09',
    assignedAdmin: 'Nadee Silva',
    status: 'Open',
    attachments: ['reminder-screen.png'],
    conversation: [
      { title: 'Rohan Mehta', description: 'Reported duplicate reminders on Android.', time: '7 hr ago', tone: 'warning' },
    ],
    notes: 'Related to stale token issue.',
  },
  {
    id: 'rep_8942',
    reporter: 'Chen Wei',
    category: 'Feature request',
    priority: 'Low',
    preview: 'Please add spaced repetition calendar export.',
    submittedDate: '2026-07-14 09:55',
    assignedAdmin: 'Product queue',
    status: 'Waiting on user',
    attachments: [],
    conversation: [
      { title: 'Support Admin', description: 'Asked user which calendar provider matters most.', time: '1 day ago', tone: 'neutral' },
    ],
    notes: 'Product discovery candidate.',
  },
]

export const auditLogs: AuditLog[] = [
  {
    id: 'aud_501',
    administrator: 'Nadee Silva',
    action: 'Suspended account',
    target: 'usr_09972',
    previousValue: 'Active',
    newValue: 'Suspended',
    reason: 'Repeated policy violations in AI prompts',
    ipAddress: '203.115.14.82',
    timestamp: '2026-07-16 20:01:11',
  },
  {
    id: 'aud_488',
    administrator: 'Sanjay Jay',
    action: 'Updated system setting',
    target: 'Quiz generation daily limit',
    previousValue: '30',
    newValue: '45',
    reason: 'Exam-week temporary allowance',
    ipAddress: '203.94.67.12',
    timestamp: '2026-07-16 17:45:30',
  },
  {
    id: 'aud_471',
    administrator: 'Asha Kumar',
    action: 'Changed role',
    target: 'adm_012',
    previousValue: 'Support Admin',
    newValue: 'Content Admin',
    reason: 'Needs report response access',
    ipAddress: '112.134.22.4',
    timestamp: '2026-07-15 16:02:44',
  },
]

export const admins: AdminMember[] = [
  {
    id: 'adm_001',
    name: 'Sanjay Jay',
    email: 'sanjay@academent.ai',
    role: 'Super Admin',
    status: 'Enabled',
    mfaRequired: true,
    lastActive: '2026-07-16 20:16',
    activityScore: '42 actions this week',
    permissions: ['All system settings', 'Role management', 'Audit access'],
  },
  {
    id: 'adm_012',
    name: 'Nadee Silva',
    email: 'nadee.silva@academent.ai',
    role: 'Support Admin',
    status: 'Enabled',
    mfaRequired: true,
    lastActive: '2026-07-16 18:02',
    activityScore: '86 report actions',
    permissions: ['User support', 'Reports', 'Notification review'],
  },
  {
    id: 'adm_018',
    name: 'Asha Kumar',
    email: 'asha@academent.ai',
    role: 'Content Admin',
    status: 'Enabled',
    mfaRequired: true,
    lastActive: '2026-07-16 19:32',
    activityScore: '31 content decisions',
    permissions: ['Reports', 'AI answer review', 'Content moderation'],
  },
  {
    id: 'adm_027',
    name: 'Iman Rafiq',
    email: 'iman@academent.ai',
    role: 'System Admin',
    status: 'Invite pending',
    mfaRequired: true,
    lastActive: 'Invitation sent',
    activityScore: 'No activity yet',
    permissions: ['Logs', 'Issues', 'Deployments'],
  },
]

export const settings: SettingSection[] = [
  {
    title: 'Platform Controls',
    description: 'Operational controls that affect student access and availability.',
    items: [
      { id: 'maintenance', label: 'Maintenance mode', description: 'Temporarily block student access with a scheduled notice.', value: false, important: true },
      { id: 'registration', label: 'User registration', description: 'Allow new student accounts to be created.', value: true, important: true },
      { id: 'banner', label: 'Announcement banner', description: 'Show a platform-wide message above student dashboards.', value: 'Exam-week support hours extended', important: false },
    ],
  },
  {
    title: 'AI Configuration',
    description: 'Availability, models, and per-user limits for AI-powered workflows.',
    items: [
      { id: 'ai-enabled', label: 'AI feature availability', description: 'Enable AI Tutor, quiz generation, and flashcard assistance.', value: true, important: true },
      { id: 'model', label: 'AI model configuration', description: 'Primary Gemini model used by tutoring and generation services.', value: 'gemini-2.5-pro', important: true },
      { id: 'usage-limit', label: 'Per-user usage limit', description: 'Daily AI request allowance for standard student accounts.', value: 120, important: true },
      { id: 'quiz-limit', label: 'Quiz generation limit', description: 'Maximum quiz generations per student per day.', value: 45, important: true },
      { id: 'flashcard-limit', label: 'Flashcard generation limit', description: 'Maximum generated flashcards per student per day.', value: 250, important: true },
    ],
  },
  {
    title: 'Files and Notifications',
    description: 'Upload policy, supported formats, and notification delivery settings.',
    items: [
      { id: 'upload-limit', label: 'File-upload limit', description: 'Maximum upload size per note file.', value: '75 MB', important: true },
      { id: 'notification-config', label: 'Notification configuration', description: 'Enable push, email, and in-app study reminders.', value: true, important: true },
      { id: 'file-formats', label: 'Supported file formats', description: 'Accepted formats for note parsing and AI extraction.', value: 'PDF, DOCX, TXT, PNG, JPG', important: false },
    ],
  },
]

export function getDashboardSnapshot(): DashboardSnapshot {
  return {
    metrics,
    userGrowth: [
      { label: 'Total users', points: [18400, 19700, 21300, 22900, 24100, 26800, 28430], color: '#4D2B8C' },
      { label: 'Active users', points: [3100, 3400, 3880, 4100, 4630, 5200, 5812], color: '#EEA727' },
    ],
    activeUsers: [
      { label: 'Mon', value: 4200, color: '#4D2B8C' },
      { label: 'Tue', value: 4810, color: '#85409D' },
      { label: 'Wed', value: 5120, color: '#EEA727' },
      { label: 'Thu', value: 5812, color: '#4D2B8C' },
      { label: 'Fri', value: 5370, color: '#85409D' },
      { label: 'Sat', value: 3900, color: '#EEA727' },
      { label: 'Sun', value: 3660, color: '#4D2B8C' },
    ],
    aiRequests: [
      { label: 'Tutor', value: 64000, color: '#4D2B8C' },
      { label: 'Quiz', value: 18904, color: '#85409D' },
      { label: 'Cards', value: 64209, color: '#EEA727' },
      { label: 'Notes', value: 17400, color: '#1f9d8a' },
    ],
    errors: [
      { label: 'Errors', points: [18, 22, 17, 31, 26, 14, 7], color: '#c2410c' },
      { label: 'Warnings', points: [71, 62, 80, 77, 64, 58, 45], color: '#EEA727' },
    ],
    featureUsage: [
      { label: 'AI Tutor', value: 38, color: '#4D2B8C' },
      { label: 'Notes', value: 24, color: '#85409D' },
      { label: 'Flashcards', value: 20, color: '#EEA727' },
      { label: 'Quizzes', value: 13, color: '#1f9d8a' },
      { label: 'Planner', value: 5, color: '#2563eb' },
    ],
    incidents,
    registrations,
    adminActions,
    health,
  }
}

export function getUsers(): UserSummary[] {
  return users
}

export function getUserById(id: string): UserSummary | undefined {
  return users.find((user) => user.id === id)
}

export function getLogs(): SystemLog[] {
  return logs
}

export function getIssues(): Issue[] {
  return issues
}

export function getReports(): Report[] {
  return reports
}

export function getAuditLogs(): AuditLog[] {
  return auditLogs
}

export function getAdmins(): AdminMember[] {
  return admins
}

export function getSettings(): SettingSection[] {
  return settings
}
