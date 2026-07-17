import { useMemo, useState } from 'react'
import { FilterBar } from '../../components/common/FilterBar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StateBlock } from '../../components/ui/StateBlock'
import { useAdmin } from '../../hooks/useAdmin'
import { useAsyncData } from '../../hooks/useAsyncData'
import { loadUsers, recordAuditLog, updateUserAdminFields, type AdminUserDetails } from '../../services/adminData'
import type { AccountStatus, UsageLevel, UserRole, UserSummary } from '../../types/admin'

interface UsersPageProps {
  onOpenUser: (id: string) => void
}

type UserAction =
  | 'View profile'
  | 'Suspend account'
  | 'Reactivate account'
  | 'Reset usage limit'
  | 'Revoke sessions'
  | 'Change role'
  | 'Schedule account deletion'

interface PendingAction {
  action: UserAction
  user: UserSummary
}

const statusTone: Record<AccountStatus, 'good' | 'warning' | 'danger' | 'neutral'> = {
  Active: 'good',
  Suspended: 'warning',
  Disabled: 'danger',
  'Deletion pending': 'danger',
}

const usageTone: Record<UsageLevel, 'good' | 'neutral' | 'warning' | 'danger'> = {
  Low: 'good',
  Normal: 'neutral',
  High: 'warning',
  Critical: 'danger',
}

const actions: UserAction[] = [
  'View profile',
  'Suspend account',
  'Reactivate account',
  'Reset usage limit',
  'Revoke sessions',
  'Change role',
  'Schedule account deletion',
]

const requiresReason = (action: UserAction) => action === 'Suspend account' || action === 'Schedule account deletion'
const isDangerous = (action: UserAction) => action === 'Suspend account' || action === 'Revoke sessions' || action === 'Schedule account deletion'

export function UsersPage({ onOpenUser }: UsersPageProps) {
  const { session } = useAdmin()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | AccountStatus>('All')
  const [role, setRole] = useState<'All' | UserRole>('All')
  const [registrationPeriod, setRegistrationPeriod] = useState('Any registration')
  const [lastActive, setLastActive] = useState('Any last-active')
  const [usage, setUsage] = useState<'All usage' | UsageLevel>('All usage')
  const [page, setPage] = useState(1)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [reason, setReason] = useState('')
  const [actionError, setActionError] = useState('')
  const { data: users, error, loading, reload } = useAsyncData<AdminUserDetails[]>(loadUsers, [])

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    const now = Date.now()

    return users.filter((user) => {
      const matchesSearch =
        !normalized ||
        user.fullName.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized) ||
        user.id.toLowerCase().includes(normalized)
      const matchesStatus = status === 'All' || user.status === status
      const matchesRole = role === 'All' || user.role === role
      const matchesUsage = usage === 'All usage' || user.usageLevel === usage
      const matchesRegistration = registrationPeriod === 'Any registration' || (
        user.createdAtMs ? now - user.createdAtMs <= (registrationPeriod === 'Last 7 days' ? 7 : registrationPeriod === 'Last 30 days' ? 30 : 92) * 24 * 60 * 60 * 1000 : false
      )
      const matchesLastActive = lastActive === 'Any last-active' || (
        lastActive === 'Active today'
          ? Boolean(user.lastActiveMs && now - user.lastActiveMs <= 24 * 60 * 60 * 1000)
          : lastActive === 'Inactive 7 days'
            ? Boolean(!user.lastActiveMs || now - user.lastActiveMs > 7 * 24 * 60 * 60 * 1000)
            : Boolean(!user.lastActiveMs || now - user.lastActiveMs > 30 * 24 * 60 * 60 * 1000)
      )

      return matchesSearch && matchesStatus && matchesRole && matchesUsage && matchesRegistration && matchesLastActive
    })
  }, [lastActive, registrationPeriod, role, search, status, usage, users])

  const pageSize = 4
  const pageCount = Math.max(Math.ceil(filteredUsers.length / pageSize), 1)
  const pageUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize)

  const performAction = (action: UserAction, user: UserSummary) => {
    if (action === 'View profile') {
      onOpenUser(user.id)
      return
    }

    setReason('')
    setActionError('')
    setPendingAction({ action, user })
  }

  const confirmAction = async () => {
    if (!pendingAction) return
    if (requiresReason(pendingAction.action) && reason.trim().length < 8) return

    try {
      if (pendingAction.action === 'Suspend account') {
        await updateUserAdminFields(pendingAction.user.id, { status: 'Suspended' })
      }
      if (pendingAction.action === 'Reactivate account') {
        await updateUserAdminFields(pendingAction.user.id, { status: 'Active', disabled: false })
      }
      if (pendingAction.action === 'Schedule account deletion') {
        await updateUserAdminFields(pendingAction.user.id, { status: 'Deletion pending' })
      }
      await recordAuditLog({
        administrator: session?.email || 'Current admin',
        action: pendingAction.action,
        target: pendingAction.user.id,
        previousValue: pendingAction.user.status,
        newValue: pendingAction.action,
        reason: reason || 'Admin action from user management',
        ipAddress: 'Client side',
      })
      setPendingAction(null)
      reload()
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : 'Could not apply this admin action.')
    }
  }

  if (loading) {
    return <StateBlock type="loading" title="Loading Firebase users" message="Reading users and their study subcollections from Firestore." />
  }

  if (error) {
    return <StateBlock type="permission" title="User data unavailable" message={error} actionLabel="Retry" onAction={reload} />
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span>User Management</span>
          <h2>Search, filter, and manage Academent accounts</h2>
          <p>Includes account status, roles, registration timing, study activity, AI usage, and security actions from Firebase.</p>
        </div>
        <Button icon="activity" variant="secondary" onClick={reload}>Refresh users</Button>
      </section>

      <FilterBar>
        <input type="search" placeholder="Search name, email, or user ID" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value as 'All' | AccountStatus)}>
          <option>All</option>
          <option>Active</option>
          <option>Suspended</option>
          <option>Disabled</option>
          <option>Deletion pending</option>
        </select>
        <select value={role} onChange={(event) => setRole(event.target.value as 'All' | UserRole)}>
          <option>All</option>
          <option>Student</option>
          <option>Support Admin</option>
          <option>Content Admin</option>
          <option>System Admin</option>
          <option>Super Admin</option>
        </select>
        <select value={registrationPeriod} onChange={(event) => setRegistrationPeriod(event.target.value)}>
          <option>Any registration</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>This quarter</option>
        </select>
        <select value={lastActive} onChange={(event) => setLastActive(event.target.value)}>
          <option>Any last-active</option>
          <option>Active today</option>
          <option>Inactive 7 days</option>
          <option>Inactive 30 days</option>
        </select>
        <select value={usage} onChange={(event) => setUsage(event.target.value as 'All usage' | UsageLevel)}>
          <option>All usage</option>
          <option>Low</option>
          <option>Normal</option>
          <option>High</option>
          <option>Critical</option>
        </select>
      </FilterBar>

      <section className="panel data-panel">
        <div className="panel-heading">
          <div>
            <h2>Users</h2>
            <p>{filteredUsers.length} matching accounts</p>
          </div>
        </div>
        {pageUsers.length ? (
          <>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Email</th>
                    <th>User ID</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Registered</th>
                    <th>Last login</th>
                    <th>Study activity</th>
                    <th>AI usage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.map((user) => (
                    <tr key={user.id}>
                      <td data-label="Profile">
                        <div className="identity-cell">
                          <span className="avatar">{user.avatar}</span>
                          <strong>{user.fullName}</strong>
                        </div>
                      </td>
                      <td data-label="Email">{user.email}</td>
                      <td data-label="User ID"><code>{user.id}</code></td>
                      <td data-label="Status"><Badge tone={statusTone[user.status]}>{user.status}</Badge></td>
                      <td data-label="Role">{user.role}</td>
                      <td data-label="Registration date">{user.registrationDate}</td>
                      <td data-label="Last login">{user.lastLogin}</td>
                      <td data-label="Study activity">{user.studyActivity}</td>
                      <td data-label="AI usage"><Badge tone={usageTone[user.usageLevel]}>{`${user.aiUsage}% ${user.usageLevel}`}</Badge></td>
                      <td data-label="Actions">
                        <div className="action-row">
                          <Button size="sm" variant="ghost" onClick={() => onOpenUser(user.id)}>View</Button>
                          <select aria-label={`Actions for ${user.fullName}`} defaultValue="" onChange={(event) => performAction(event.target.value as UserAction, user)}>
                            <option value="" disabled>Actions</option>
                            {actions.map((action) => (
                              <option key={action}>{action}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <Button variant="ghost" disabled={page === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Previous</Button>
              <span>Page {page} of {pageCount}</span>
              <Button variant="ghost" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>Next</Button>
            </div>
          </>
        ) : (
          <StateBlock type="no-results" title="No users found" message="Firestore returned no matching user documents for the current filters." />
        )}
      </section>

      {pendingAction ? (
        <Modal
          danger={isDangerous(pendingAction.action)}
          title={pendingAction.action}
          description={`${pendingAction.action} for ${pendingAction.user.fullName}.`}
          confirmLabel="Apply action"
          onClose={() => setPendingAction(null)}
          onConfirm={confirmAction}
        >
          {requiresReason(pendingAction.action) ? (
            <label>
              Administrator reason
              <textarea
                placeholder="Enter a clear reason for audit logs"
                required
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              {reason && reason.trim().length < 8 ? <span className="field-error">Reason must be at least 8 characters.</span> : null}
            </label>
          ) : (
            <p>This action will be recorded in the secure audit log.</p>
          )}
          {actionError ? <span className="field-error">{actionError}</span> : null}
        </Modal>
      ) : null}
    </div>
  )
}