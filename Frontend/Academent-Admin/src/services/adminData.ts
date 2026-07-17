import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
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
  UserRole,
  UserSummary,
} from '../types/admin'
import { db, firebaseConfigStatus } from './firebase'
import { loadSystemLogs } from './logs'

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

export interface AdminUserDetails extends UserSummary {
  createdAtMs?: number
  lastActiveMs?: number
  noteCount: number
  pdfCount: number
  semesterCount: number
  moduleCount: number
  notificationCount: number
  unreadNotifications: number
  plannerEventCount: number
  tutorConversationCount: number
  recentActivity: ActivityItem[]
  contentUsage: BarDatum[]
  quizStatus: string
  flashcardStatus: string
  plannerStatus: string
  notificationStatus: string
}

interface NoteStats {
  notes: number
  pdfs: number
  semesters: number
  modules: number
}

interface UserAggregates {
  noteStats: NoteStats
  quizCount: number
  flashcardCount: number
  flashcardDecks: number
  plannerEventCount: number
  tutorConversationCount: number
  notificationCount: number
  unreadNotifications: number
  devices: string[]
  recentActivity: ActivityItem[]
}

interface ReportCountMap {
  [userId: string]: number
}

interface CollectionDoc {
  id: string
  data: DocumentData
  collectionName?: string
}

const adminRoles: UserRole[] = ['Support Admin', 'Content Admin', 'System Admin', 'Super Admin']
const adminRoleAliases: Record<string, UserRole> = {
  admin: 'System Admin',
  supportadmin: 'Support Admin',
  'support admin': 'Support Admin',
  contentadmin: 'Content Admin',
  'content admin': 'Content Admin',
  systemadmin: 'System Admin',
  'system admin': 'System Admin',
  superadmin: 'Super Admin',
  'super admin': 'Super Admin',
}
const featureColors = ['#7B5CFF', '#A178FF', '#F2B544', '#1f9d8a', '#2563eb']

const requireDb = () => {
  if (!db) throw new Error(`Firebase is missing admin config keys: ${firebaseConfigStatus.missingKeys.join(', ')}`)
  return db
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

const formatDateTime = (value: unknown, fallback = 'Not recorded'): string => {
  const date = toDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const formatDate = (value: unknown, fallback = 'Not recorded'): string => {
  const date = toDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

const relativeTime = (value: unknown): string => {
  const date = toDate(value)
  if (!date) return 'Not recorded'

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(date)
}

const asText = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const asNumber = (value: unknown, fallback = 0): number => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const asDocumentArray = (value: unknown): DocumentData[] => (
  Array.isArray(value) ? value.filter((item): item is DocumentData => typeof item === 'object' && item !== null) : []
)

const normalizeRole = (role: unknown): UserRole => {
  const normalized = asText(role, 'Student').replace(/[-_]+/g, ' ').trim().toLowerCase()
  const compact = normalized.replace(/\s+/g, '')
  const match = adminRoles.find((item) => item.toLowerCase() === normalized)
  return match ?? adminRoleAliases[normalized] ?? adminRoleAliases[compact] ?? 'Student'
}

const hasAdminRole = (role: unknown): boolean => adminRoles.includes(normalizeRole(role))

const getStoredRole = (data: DocumentData): unknown => data.role ?? data.adminRole ?? (data.isAdmin === true ? 'System Admin' : undefined)

const getInitials = (name: string): string => name
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase() || 'U'

const toAccountStatus = (data: DocumentData): UserSummary['status'] => {
  const status = asText(data.status || data.accountStatus).toLowerCase()
  if (status.includes('delete')) return 'Deletion pending'
  if (status === 'suspended') return 'Suspended'
  if (status === 'disabled' || data.disabled === true) return 'Disabled'
  return 'Active'
}

const toUsageLevel = (value: number): UserSummary['usageLevel'] => {
  if (value >= 85) return 'Critical'
  if (value >= 65) return 'High'
  if (value >= 25) return 'Normal'
  return 'Low'
}

const countFolder = (folder: DocumentData): NoteStats => {
  const childStats = asDocumentArray(folder.folders).reduce<NoteStats>((total, child) => {
    const stats = countFolder(child)
    return {
      notes: total.notes + stats.notes,
      pdfs: total.pdfs + stats.pdfs,
      semesters: total.semesters,
      modules: total.modules,
    }
  }, { notes: 0, pdfs: 0, semesters: 0, modules: 0 })

  return {
    notes: childStats.notes + (Array.isArray(folder.notes) ? folder.notes.length : 0),
    pdfs: childStats.pdfs + (Array.isArray(folder.pdfs) ? folder.pdfs.length : 0),
    semesters: 0,
    modules: 0,
  }
}

const countNoteManagement = (data: DocumentData | null): NoteStats => {
  const semesters = asDocumentArray(data?.semesters)

  return semesters.reduce<NoteStats>((total, semester) => {
    const modules = asDocumentArray(semester.modules)
    const moduleStats = modules.reduce<NoteStats>((moduleTotal, module) => {
      const folderStats = asDocumentArray(module.folders).reduce<NoteStats>((folderTotal, folder) => {
        const stats = countFolder(folder)
        return {
          notes: folderTotal.notes + stats.notes,
          pdfs: folderTotal.pdfs + stats.pdfs,
          semesters: folderTotal.semesters,
          modules: folderTotal.modules,
        }
      }, { notes: 0, pdfs: 0, semesters: 0, modules: 0 })

      return {
        notes: moduleTotal.notes + folderStats.notes + (Array.isArray(module.notes) ? module.notes.length : 0),
        pdfs: moduleTotal.pdfs + folderStats.pdfs + (Array.isArray(module.pdfs) ? module.pdfs.length : 0),
        semesters: moduleTotal.semesters,
        modules: moduleTotal.modules + 1,
      }
    }, { notes: 0, pdfs: 0, semesters: 0, modules: 0 })

    return {
      notes: total.notes + moduleStats.notes,
      pdfs: total.pdfs + moduleStats.pdfs,
      semesters: total.semesters + 1,
      modules: total.modules + moduleStats.modules,
    }
  }, { notes: 0, pdfs: 0, semesters: 0, modules: 0 })
}

const loadCollectionDocs = async (pathSegments: string[]): Promise<CollectionDoc[]> => {
  const database = requireDb()
  const [rootPath, ...childPaths] = pathSegments
  if (!rootPath) throw new Error('A Firestore collection path is required.')
  const snapshot = await getDocs(collection(database, rootPath, ...childPaths))
  return snapshot.docs.map((item) => ({ id: item.id, data: item.data(), collectionName: pathSegments.length === 1 ? rootPath : undefined }))
}

const safeLoadTopLevelDocs = async (collectionName: string): Promise<CollectionDoc[]> => {
  try {
    return await loadCollectionDocs([collectionName])
  } catch {
    return []
  }
}

const loadUserAggregates = async (uid: string): Promise<UserAggregates> => {
  const database = requireDb()
  const [noteSnapshot, quizzes, flashCollections, plannerEvents, tutorConversations, notifications, devices] = await Promise.all([
    getDoc(doc(database, 'users', uid, 'noteManagement', 'structure')).catch(() => null),
    loadCollectionDocs(['users', uid, 'quizzes']).catch(() => []),
    loadCollectionDocs(['users', uid, 'flashCardCollections']).catch(() => []),
    loadCollectionDocs(['users', uid, 'studyPlannerEvents']).catch(() => []),
    loadCollectionDocs(['users', uid, 'aiTutorConversations']).catch(() => []),
    loadCollectionDocs(['users', uid, 'notifications']).catch(() => []),
    loadCollectionDocs(['users', uid, 'devices']).catch(() => []),
  ])

  const noteStats = countNoteManagement(noteSnapshot?.exists() ? noteSnapshot.data() : null)
  const flashcardCount = flashCollections.reduce((sum, item) => (
    sum + asNumber(item.data.cardCount ?? item.data.analytics?.totalFlashCards)
  ), 0)
  const deviceLabels = devices.map((item) => {
    const data = item.data
    return asText(data.deviceName || data.browser || data.platform || data.userAgent, item.id)
  })

  const activityCandidates: ActivityItem[] = [
    ...quizzes.slice(0, 4).map((item) => ({
      title: asText(item.data.title, 'Quiz activity'),
      description: `${asNumber(item.data.totalQuestions || item.data.questions?.length)} questions, ${asText(item.data.status, 'saved')}`,
      time: relativeTime(item.data.updatedAt || item.data.createdAt),
      tone: item.data.status === 'completed' ? 'good' as const : 'neutral' as const,
    })),
    ...flashCollections.slice(0, 4).map((item) => ({
      title: asText(item.data.title, 'Flashcard collection'),
      description: `${asNumber(item.data.cardCount || item.data.analytics?.totalFlashCards)} cards`,
      time: relativeTime(item.data.updatedAt || item.data.createdAt),
      tone: 'neutral' as const,
    })),
    ...plannerEvents.slice(0, 4).map((item) => ({
      title: asText(item.data.title || item.data.studyTopic, 'Study planner event'),
      description: `${asText(item.data.type || item.data.eventType, 'event')} is ${asText(item.data.status, 'pending')}`,
      time: relativeTime(item.data.updatedAt || item.data.startAt || item.data.createdAt),
      tone: item.data.status === 'completed' ? 'good' as const : 'warning' as const,
    })),
  ]

  return {
    noteStats,
    quizCount: quizzes.length,
    flashcardCount,
    flashcardDecks: flashCollections.length,
    plannerEventCount: plannerEvents.length,
    tutorConversationCount: tutorConversations.length,
    notificationCount: notifications.length,
    unreadNotifications: notifications.filter((item) => item.data.isRead === false && item.data.isDeleted !== true).length,
    devices: deviceLabels.length ? deviceLabels : ['No registered devices'],
    recentActivity: activityCandidates.slice(0, 8),
  }
}

const reportUserId = (report: DocumentData): string => asText(report.userId || report.uid || report.reporterId || report.createdBy)

const loadReportCountsByUser = async (): Promise<ReportCountMap> => {
  const docs = [...await safeLoadTopLevelDocs('userReports'), ...await safeLoadTopLevelDocs('reports')]
  return docs.reduce<ReportCountMap>((counts, item) => {
    const uid = reportUserId(item.data)
    if (!uid) return counts
    counts[uid] = (counts[uid] || 0) + 1
    return counts
  }, {})
}

const mapUserSummary = (id: string, data: DocumentData, aggregates: UserAggregates, reportCounts: ReportCountMap): AdminUserDetails => {
  const fullName = asText(data.fullName || data.displayName || data.name, asText(data.email, id).split('@')[0])
  const aiWork = aggregates.quizCount + aggregates.flashcardDecks + aggregates.tutorConversationCount
  const aiUsage = Math.min(100, Math.round(aiWork * 8 + aggregates.flashcardCount / 20))
  const role = normalizeRole(getStoredRole(data))
  const lastActiveSource = data.lastLoginAt || data.lastActiveAt || data.updatedAt

  return {
    id,
    avatar: getInitials(fullName),
    fullName,
    email: asText(data.email, 'No email recorded'),
    status: toAccountStatus(data),
    role,
    registrationDate: formatDate(data.createdAt),
    lastLogin: formatDateTime(lastActiveSource),
    studyActivity: `${aggregates.plannerEventCount} planner items, ${aggregates.quizCount} quizzes`,
    aiUsage,
    usageLevel: toUsageLevel(aiUsage),
    uploadedNotes: aggregates.noteStats.notes + aggregates.noteStats.pdfs,
    quizzes: aggregates.quizCount,
    flashcards: aggregates.flashcardCount,
    reports: reportCounts[id] || 0,
    devices: aggregates.devices,
    createdAtMs: toDate(data.createdAt)?.getTime(),
    lastActiveMs: toDate(lastActiveSource)?.getTime(),
    noteCount: aggregates.noteStats.notes,
    pdfCount: aggregates.noteStats.pdfs,
    semesterCount: aggregates.noteStats.semesters,
    moduleCount: aggregates.noteStats.modules,
    notificationCount: aggregates.notificationCount,
    unreadNotifications: aggregates.unreadNotifications,
    plannerEventCount: aggregates.plannerEventCount,
    tutorConversationCount: aggregates.tutorConversationCount,
    recentActivity: aggregates.recentActivity,
    contentUsage: [
      { label: 'Notes', value: aggregates.noteStats.notes, color: featureColors[0] },
      { label: 'PDFs', value: aggregates.noteStats.pdfs, color: featureColors[1] },
      { label: 'Quizzes', value: aggregates.quizCount, color: featureColors[2] },
      { label: 'Flashcards', value: aggregates.flashcardCount, color: featureColors[3] },
    ],
    quizStatus: `${aggregates.quizCount} quizzes saved in Firestore`,
    flashcardStatus: `${aggregates.flashcardDecks} decks with ${aggregates.flashcardCount} cards`,
    plannerStatus: `${aggregates.plannerEventCount} planner events found`,
    notificationStatus: `${aggregates.unreadNotifications} unread of ${aggregates.notificationCount} notifications`,
  }
}

export async function loadUsers(): Promise<AdminUserDetails[]> {
  const database = requireDb()
  const [usersSnapshot, reportCounts] = await Promise.all([
    getDocs(collection(database, 'users')),
    loadReportCountsByUser(),
  ])

  const users = await Promise.all(usersSnapshot.docs.map(async (item) => {
    const aggregates = await loadUserAggregates(item.id)
    return mapUserSummary(item.id, item.data(), aggregates, reportCounts)
  }))

  return users.sort((left, right) => (right.createdAtMs || 0) - (left.createdAtMs || 0))
}

export async function loadUserById(userId: string): Promise<AdminUserDetails | null> {
  const database = requireDb()
  const [snapshot, reportCounts] = await Promise.all([
    getDoc(doc(database, 'users', userId)),
    loadReportCountsByUser(),
  ])
  if (!snapshot.exists()) return null

  const aggregates = await loadUserAggregates(userId)
  return mapUserSummary(snapshot.id, snapshot.data(), aggregates, reportCounts)
}

const mapReport = (snapshot: QueryDocumentSnapshot<DocumentData> | CollectionDoc): Report => {
  const data = typeof snapshot.data === 'function' ? snapshot.data() : snapshot.data
  const reporter = asText(data.reporter || data.reporterName || data.fullName || data.email || data.userEmail || data.userId, 'Unknown reporter')
  return {
    id: snapshot.id,
    reporter,
    category: asText(data.category, 'General feedback') as Report['category'],
    priority: asText(data.priority, 'Medium') as Report['priority'],
    preview: asText(data.preview || data.message || data.description || data.title, 'No report message recorded.'),
    submittedDate: formatDateTime(data.submittedDate || data.createdAt),
    assignedAdmin: asText(data.assignedAdmin || data.assignedTo, 'Support queue'),
    status: asText(data.status, 'Open') as Report['status'],
    attachments: Array.isArray(data.attachments) ? data.attachments.map((item: unknown) => asText(item)).filter(Boolean) : [],
    conversation: Array.isArray(data.conversation) ? data.conversation : [],
    notes: asText(data.notes || data.internalNotes, 'No internal notes recorded.'),
    sourceCollection: 'collectionName' in snapshot ? snapshot.collectionName as Report['sourceCollection'] : undefined,
  }
}

export async function loadReports(): Promise<Report[]> {
  const docs = [...await safeLoadTopLevelDocs('userReports'), ...await safeLoadTopLevelDocs('reports')]
  return docs.map(mapReport).sort((left, right) => Date.parse(right.submittedDate) - Date.parse(left.submittedDate))
}

export async function updateReportFields(report: Report, patch: Partial<{ assignedAdmin: string; notes: string; status: Report['status'] }>): Promise<void> {
  const database = requireDb()
  const collectionName = report.sourceCollection || 'userReports'
  await setDoc(doc(database, collectionName, report.id), {
    ...patch,
    internalNotes: patch.notes,
    assignedTo: patch.assignedAdmin,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function loadAuditLogs(): Promise<AuditLog[]> {
  const docs = await safeLoadTopLevelDocs('adminAuditLogs')
  return docs.map((item) => {
    const data = item.data
    return {
      id: item.id,
      administrator: asText(data.administrator || data.adminEmail || data.adminName, 'Unknown administrator'),
      action: asText(data.action, 'Admin action'),
      target: asText(data.target || data.targetId, 'Unknown target'),
      previousValue: asText(data.previousValue, 'Not recorded'),
      newValue: asText(data.newValue, 'Not recorded'),
      reason: asText(data.reason, 'No reason recorded'),
      ipAddress: asText(data.ipAddress, 'Not captured'),
      timestamp: formatDateTime(data.timestamp || data.createdAt),
    }
  })
}

export async function recordAuditLog(payload: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  const database = requireDb()
  await addDoc(collection(database, 'adminAuditLogs'), {
    ...payload,
    createdAt: serverTimestamp(),
    timestamp: serverTimestamp(),
  })
}

export async function loadAdmins(): Promise<AdminMember[]> {
  const users = await loadUsers()
  return users
    .filter((user) => hasAdminRole(user.role) || user.email.toLowerCase().endsWith('@academent.ai'))
    .map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: hasAdminRole(user.role) ? user.role : 'System Admin',
      status: user.status === 'Disabled' ? 'Disabled' : 'Enabled',
      mfaRequired: true,
      lastActive: user.lastLogin,
      activityScore: `${user.quizzes + user.plannerEventCount + user.tutorConversationCount} tracked actions`,
      permissions: user.role === 'Super Admin'
        ? ['User support', 'Reports', 'Logs', 'System settings', 'Role management', 'Audit access']
        : ['User support', 'Reports', 'Logs'],
    }))
}

export async function loadSettings(): Promise<SettingSection[]> {
  const docs = await safeLoadTopLevelDocs('systemSettings')
  const groups = new Map<string, SettingSection>()

  docs.forEach((item) => {
    const data = item.data
    const title = asText(data.sectionTitle || data.section, 'General')
    const section = groups.get(title) ?? {
      title,
      description: asText(data.sectionDescription, 'Settings loaded from Firestore.'),
      items: [],
    }
    section.items.push({
      id: item.id,
      label: asText(data.label || data.name, item.id),
      description: asText(data.description, 'No description recorded.'),
      value: typeof data.value === 'boolean' || typeof data.value === 'number' ? data.value : asText(data.value),
      important: Boolean(data.important),
    })
    groups.set(title, section)
  })

  return [...groups.values()].map((section) => ({
    ...section,
    items: section.items.sort((left, right) => left.label.localeCompare(right.label)),
  }))
}

export async function saveSystemSetting(item: SettingSection['items'][number], value: string | boolean | number): Promise<void> {
  const database = requireDb()
  await setDoc(doc(database, 'systemSettings', item.id), {
    label: item.label,
    description: item.description,
    value,
    important: item.important,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function updateUserAdminFields(userId: string, patch: Partial<{ role: UserRole; status: string; disabled: boolean }>): Promise<void> {
  const database = requireDb()
  await updateDoc(doc(database, 'users', userId), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}

const groupLogsIntoIssues = (logs: SystemLog[]): Issue[] => {
  const grouped = new Map<string, SystemLog[]>()
  logs
    .filter((log) => log.level === 'Error' || log.level === 'Critical' || log.level === 'Warning')
    .forEach((log) => {
      const key = `${log.service}|${log.stackTrace || log.message}`
      grouped.set(key, [...(grouped.get(key) || []), log])
    })

  return [...grouped.entries()].map(([key, items], index) => {
    const first = items[0]
    const critical = items.some((item) => item.level === 'Critical')
    const error = items.some((item) => item.level === 'Error')
    const affectedUsers = new Set(items.map((item) => item.user)).size
    const [, stackTrace] = key.split('|')
    const severity: Issue['severity'] = critical ? 'Critical' : error ? 'High' : items.length > 5 ? 'Medium' : 'Low'
    const statusVotes = items.map((item) => item.issueStatus).filter(Boolean)
    const status: Issue['status'] = statusVotes.length && statusVotes.every((item) => item === statusVotes[0]) ? statusVotes[0] as Issue['status'] : items.every((item) => item.resolved) ? 'Resolved' : 'Investigating'

    return {
      id: `issue_${index}_${first.id}`,
      title: first.message,
      severity,
      feature: first.service,
      occurrences: items.reduce((sum, item) => sum + (item.occurrenceCount || 1), 0),
      affectedUsers,
      firstSeen: items[items.length - 1]?.firstOccurrence || first.timestamp,
      lastSeen: first.latestOccurrence || first.timestamp,
      assignedAdmin: first.assignedTo,
      status,
      summary: `${items.length} related log entries grouped from Firebase systemLogs.`,
      graph: buildRecentSeries(items.map((item) => item.timestampMs || 0), 8),
      stackTrace: stackTrace || first.stackTrace,
      relatedRequests: items.map((item) => item.requestId).filter(Boolean).slice(0, 8),
      logIds: items.map((item) => item.id),
      browsers: buildBrowserDistribution(items),
      discussion: [],
      deploymentVersion: 'Not recorded',
    }
  }).sort((left, right) => right.occurrences - left.occurrences)
}

const buildRecentSeries = (times: number[], buckets: number): number[] => {
  const result = Array.from({ length: buckets }, () => 0)
  const now = Date.now()
  const windowMs = 7 * 24 * 60 * 60 * 1000
  times.forEach((time) => {
    if (!time) return
    const age = now - time
    if (age < 0 || age > windowMs) return
    const index = Math.min(buckets - 1, Math.max(0, buckets - 1 - Math.floor(age / (windowMs / buckets))))
    result[index] += 1
  })
  return result
}

const buildBrowserDistribution = (logs: SystemLog[]): BarDatum[] => {
  const counts = logs.reduce<Record<string, number>>((total, log) => {
    const browser = log.browser.split(' ')[0] || 'Unknown'
    total[browser] = (total[browser] || 0) + 1
    return total
  }, {})

  return Object.entries(counts).slice(0, 5).map(([label, value], index) => ({
    label,
    value,
    color: featureColors[index % featureColors.length],
  }))
}

export async function loadIssues(): Promise<Issue[]> {
  const logs = await loadSystemLogs()
  return groupLogsIntoIssues(logs)
}

export async function updateIssueFields(issue: Issue, patch: { assignedAdmin: string; status: Issue['status']; notes: string }): Promise<void> {
  const database = requireDb()
  const batch = writeBatch(database)
  const resolved = patch.status === 'Resolved' || patch.status === 'Ignored'

  issue.logIds.forEach((logId) => {
    batch.update(doc(database, 'systemLogs', logId), {
      assignedTo: patch.assignedAdmin,
      issueStatus: patch.status,
      notes: patch.notes,
      resolved,
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

const createMetric = (label: string, value: string, change: string, tone: Metric['tone'], icon: string): Metric => ({
  label,
  value,
  change,
  tone,
  icon,
})

const formatCompact = (value: number): string => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(value)

const buildUserGrowth = (users: AdminUserDetails[]): ChartSeries[] => [{
  label: 'New users',
  color: '#7B5CFF',
  points: buildRecentSeries(users.map((user) => user.createdAtMs || 0), 7),
}]

const buildWeekdayBars = (users: AdminUserDetails[]): BarDatum[] => {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const counts = labels.map((label, index) => ({ label, value: 0, color: featureColors[index % featureColors.length] }))
  users.forEach((user) => {
    if (!user.lastActiveMs) return
    counts[new Date(user.lastActiveMs).getDay()].value += 1
  })
  return counts
}

const buildHealth = (logs: SystemLog[]): SystemHealth[] => {
  const services = ['Firebase Auth', 'Firestore', 'Backend API', 'AI Tutor', 'Quiz API', 'Flashcards', 'Notifications']
  return services.map((service) => {
    const serviceLogs = logs.filter((log) => log.service.toLowerCase().includes(service.split(' ')[0].toLowerCase()))
    const hasCritical = serviceLogs.some((log) => log.level === 'Critical' && !log.resolved)
    const hasError = serviceLogs.some((log) => log.level === 'Error' && !log.resolved)
    const status = hasCritical ? 'Offline' : hasError ? 'Degraded' : 'Operational'
    return {
      service,
      status,
      latency: 'Not reported',
      uptime: status === 'Operational' ? 'No open errors' : 'Review logs',
      detail: `${serviceLogs.length} related Firebase log entries in the current stream.`,
    }
  })
}

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [users, logs, reports, auditLogs] = await Promise.all([
    loadUsers(),
    loadSystemLogs().catch(() => []),
    loadReports(),
    loadAuditLogs(),
  ])

  const openIssues = groupLogsIntoIssues(logs).filter((issue) => issue.status !== 'Resolved')
  const totalNotes = users.reduce((sum, user) => sum + user.uploadedNotes, 0)
  const totalQuizzes = users.reduce((sum, user) => sum + user.quizzes, 0)
  const totalFlashcards = users.reduce((sum, user) => sum + user.flashcards, 0)
  const activeToday = users.filter((user) => user.lastActiveMs && Date.now() - user.lastActiveMs < 24 * 60 * 60 * 1000).length
  const errors = logs.filter((log) => log.level === 'Error' || log.level === 'Critical')

  return {
    metrics: [
      createMetric('Total users', formatCompact(users.length), `${activeToday} active today`, 'good', 'users'),
      createMetric('Active today', formatCompact(activeToday), 'Based on user last-active fields', activeToday ? 'good' : 'neutral', 'activity'),
      createMetric('Generated quizzes', formatCompact(totalQuizzes), 'From users/*/quizzes', 'good', 'quiz'),
      createMetric('Generated flashcards', formatCompact(totalFlashcards), 'From flashCardCollections', 'good', 'cards'),
      createMetric('Uploaded notes/files', formatCompact(totalNotes), 'From noteManagement/structure', 'neutral', 'file'),
      createMetric('Open issues', formatCompact(openIssues.length), 'Grouped from systemLogs', openIssues.length ? 'warning' : 'good', 'alert'),
      createMetric('Critical errors', formatCompact(errors.filter((log) => log.level === 'Critical').length), 'From systemLogs', errors.length ? 'danger' : 'good', 'error'),
      createMetric('Reports', formatCompact(reports.length), 'From reports/userReports', reports.length ? 'warning' : 'neutral', 'reports'),
    ],
    userGrowth: buildUserGrowth(users),
    activeUsers: buildWeekdayBars(users),
    aiRequests: [
      { label: 'Tutor', value: users.reduce((sum, user) => sum + user.tutorConversationCount, 0), color: featureColors[0] },
      { label: 'Quiz', value: totalQuizzes, color: featureColors[1] },
      { label: 'Cards', value: totalFlashcards, color: featureColors[2] },
      { label: 'Notes', value: totalNotes, color: featureColors[3] },
    ],
    errors: [
      { label: 'Errors', points: buildRecentSeries(errors.map((log) => log.timestampMs || 0), 7), color: '#dc4c64' },
      { label: 'Warnings', points: buildRecentSeries(logs.filter((log) => log.level === 'Warning').map((log) => log.timestampMs || 0), 7), color: '#F2B544' },
    ],
    featureUsage: [
      { label: 'AI Tutor', value: users.reduce((sum, user) => sum + user.tutorConversationCount, 0), color: featureColors[0] },
      { label: 'Notes', value: totalNotes, color: featureColors[1] },
      { label: 'Flashcards', value: totalFlashcards, color: featureColors[2] },
      { label: 'Quizzes', value: totalQuizzes, color: featureColors[3] },
      { label: 'Planner', value: users.reduce((sum, user) => sum + user.plannerEventCount, 0), color: featureColors[4] },
    ],
    incidents: openIssues.slice(0, 4).map((issue) => ({
      title: issue.title,
      description: `${issue.feature}, ${issue.occurrences} occurrences`,
      time: issue.lastSeen,
      tone: issue.severity === 'Critical' || issue.severity === 'High' ? 'danger' : 'warning',
    })),
    registrations: users.slice(0, 4).map((user) => ({
      title: user.fullName,
      description: `${user.email} joined Academent.`,
      time: user.registrationDate,
      tone: 'good',
    })),
    adminActions: auditLogs.slice(0, 4).map((log) => ({
      title: log.administrator,
      description: `${log.action} on ${log.target}`,
      time: log.timestamp,
      tone: 'neutral',
    })),
    health: buildHealth(logs),
  }
}