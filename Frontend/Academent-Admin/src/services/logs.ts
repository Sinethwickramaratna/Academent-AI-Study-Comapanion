import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { IssueStatus, LogLevel, SystemLog } from '../types/admin'
import { db, firebaseConfigStatus } from './firebase'

const SYSTEM_LOGS_COLLECTION = 'systemLogs'
const SYSTEM_LOG_LIMIT = 250

const logLevels: LogLevel[] = ['Information', 'Warning', 'Error', 'Critical']
const issueStatuses: IssueStatus[] = ['New', 'Investigating', 'In progress', 'Resolved', 'Ignored', 'Reopened']

const asText = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const asNumber = (value: unknown, fallback = 0): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
)

const asLogLevel = (value: unknown): LogLevel => (
  logLevels.includes(value as LogLevel) ? value as LogLevel : 'Information'
)

const asIssueStatus = (value: unknown): IssueStatus | undefined => (
  issueStatuses.includes(value as IssueStatus) ? value as IssueStatus : undefined
)

const hasToDate = (value: unknown): value is { toDate: () => Date } => (
  typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function'
)

const toDate = (value: unknown): Date | null => {
  if (hasToDate(value)) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

const formatTimestamp = (value: unknown): string => {
  const date = toDate(value)
  if (!date) return 'Pending timestamp'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date)
}

const timestampMs = (value: unknown): number => toDate(value)?.getTime() ?? 0

const toStringList = (value: unknown): string[] => (
  Array.isArray(value) ? value.map((item) => asText(item)).filter(Boolean) : []
)

const stringifyMetadata = (value: unknown): string => {
  if (!value) return 'No metadata captured.'
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const mapSystemLogDocument = (snapshot: QueryDocumentSnapshot<DocumentData>): SystemLog => {
  const data = snapshot.data()
  const timestampValue = data.timestamp ?? data.createdAt

  return {
    assignedTo: asText(data.assignedTo, 'System Admin queue'),
    browser: asText(data.browser, 'Unknown browser'),
    endpoint: asText(data.endpoint, '/'),
    firstOccurrence: formatTimestamp(data.firstOccurrence ?? timestampValue),
    id: snapshot.id,
    latestOccurrence: formatTimestamp(data.latestOccurrence ?? timestampValue),
    level: asLogLevel(data.level),
    message: asText(data.message, 'No message captured.'),
    metadata: stringifyMetadata(data.metadata),
    notes: asText(data.notes, 'No notes recorded.'),
    issueStatus: asIssueStatus(data.issueStatus),
    occurrenceCount: asNumber(data.occurrenceCount, 1),
    relatedLogs: toStringList(data.relatedLogs),
    requestId: asText(data.requestId, snapshot.id),
    resolved: Boolean(data.resolved),
    service: asText(data.service, 'Frontend'),
    stackTrace: asText(data.stackTrace, 'No stack trace captured.'),
    statusCode: asNumber(data.statusCode),
    timestamp: formatTimestamp(timestampValue),
    timestampMs: timestampMs(timestampValue),
    user: asText(data.userEmail || data.user || data.userId, 'Unknown user'),
  }
}


const buildSystemLogsQuery = () => {
  if (!db) throw new Error(`Firebase is missing admin config keys: ${firebaseConfigStatus.missingKeys.join(', ')}`)

  return query(
    collection(db, SYSTEM_LOGS_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(SYSTEM_LOG_LIMIT),
  )
}

export async function loadSystemLogs(): Promise<SystemLog[]> {
  const snapshot = await getDocs(buildSystemLogsQuery())
  return snapshot.docs.map(mapSystemLogDocument)
}
export function subscribeSystemLogs(
  onLogs: (logs: SystemLog[]) => void,
  onError: (error: Error) => void,
): () => void {
  if (!db) {
    onError(new Error(`Firebase is missing admin config keys: ${firebaseConfigStatus.missingKeys.join(', ')}`))
    return () => undefined
  }

  return onSnapshot(
    buildSystemLogsQuery(),
    (snapshot) => onLogs(snapshot.docs.map(mapSystemLogDocument)),
    (error) => onError(error),
  )
}

export async function markSystemLogResolved(logId: string, resolved: boolean): Promise<void> {
  if (!db) throw new Error('Firebase is not configured for the admin portal.')

  await updateDoc(doc(db, SYSTEM_LOGS_COLLECTION, logId), {
    resolved,
    updatedAt: serverTimestamp(),
  })
}
