export type PortalView =
  | 'dashboard'
  | 'users'
  | 'logs'
  | 'issues'
  | 'reports'
  | 'audit'
  | 'admins'
  | 'settings'

export type AccountStatus = 'Active' | 'Suspended' | 'Disabled' | 'Deletion pending'
export type UserRole = 'Student' | 'Support Admin' | 'Content Admin' | 'System Admin' | 'Super Admin'
export type UsageLevel = 'Low' | 'Normal' | 'High' | 'Critical'
export type LogLevel = 'Information' | 'Warning' | 'Error' | 'Critical'
export type IssueStatus = 'New' | 'Investigating' | 'In progress' | 'Resolved' | 'Ignored' | 'Reopened'
export type ReportStatus = 'Open' | 'Assigned' | 'Waiting on user' | 'Resolved' | 'Closed'
export type ServiceState = 'Operational' | 'Degraded' | 'Offline' | 'Investigating'

export interface AdminSession {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
  mfaVerified: boolean
}

export interface Metric {
  label: string
  value: string
  change: string
  tone: 'good' | 'neutral' | 'warning' | 'danger'
  icon: string
}

export interface ChartSeries {
  label: string
  points: number[]
  color: string
}

export interface BarDatum {
  label: string
  value: number
  color?: string
}

export interface SystemHealth {
  service: string
  status: ServiceState
  latency: string
  uptime: string
  detail: string
}

export interface ActivityItem {
  title: string
  description: string
  time: string
  tone: 'good' | 'neutral' | 'warning' | 'danger'
}

export interface UserSummary {
  id: string
  avatar: string
  fullName: string
  email: string
  status: AccountStatus
  role: UserRole
  registrationDate: string
  lastLogin: string
  studyActivity: string
  aiUsage: number
  usageLevel: UsageLevel
  uploadedNotes: number
  quizzes: number
  flashcards: number
  reports: number
  devices: string[]
}

export interface SystemLog {
  id: string
  timestamp: string
  timestampMs?: number
  level: LogLevel
  service: string
  message: string
  user: string
  requestId: string
  endpoint: string
  statusCode: number
  resolved: boolean
  stackTrace: string
  metadata: string
  browser: string
  relatedLogs: string[]
  firstOccurrence: string
  latestOccurrence: string
  occurrenceCount: number
  assignedTo: string
  notes: string
  issueStatus?: IssueStatus
}

export interface Issue {
  id: string
  title: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  feature: string
  occurrences: number
  affectedUsers: number
  firstSeen: string
  lastSeen: string
  assignedAdmin: string
  status: IssueStatus
  summary: string
  graph: number[]
  stackTrace: string
  relatedRequests: string[]
  logIds: string[]
  browsers: BarDatum[]
  discussion: ActivityItem[]
  deploymentVersion: string
}

export interface Report {
  id: string
  reporter: string
  category:
    | 'Bug report'
    | 'Content problem'
    | 'AI answer problem'
    | 'Feature request'
    | 'Account issue'
    | 'General feedback'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  preview: string
  submittedDate: string
  assignedAdmin: string
  status: ReportStatus
  attachments: string[]
  conversation: ActivityItem[]
  notes: string
  sourceCollection?: 'userReports' | 'reports'
}

export interface AuditLog {
  id: string
  administrator: string
  action: string
  target: string
  previousValue: string
  newValue: string
  reason: string
  ipAddress: string
  timestamp: string
}

export interface AdminMember {
  id: string
  name: string
  email: string
  role: UserRole
  status: 'Enabled' | 'Disabled' | 'Invite pending'
  mfaRequired: boolean
  lastActive: string
  activityScore: string
  permissions: string[]
}

export interface SettingItem {
  id: string
  label: string
  description: string
  value: string | boolean | number
  important: boolean
}

export interface SettingSection {
  title: string
  description: string
  items: SettingItem[]
}
