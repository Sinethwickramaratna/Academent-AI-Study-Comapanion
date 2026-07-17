import { useMemo, useState } from 'react'
import { ActivityList } from '../../components/common/ActivityList'
import { BarChart } from '../../components/charts/BarChart'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StateBlock } from '../../components/ui/StateBlock'
import { Tabs } from '../../components/ui/Tabs'
import { useAsyncData } from '../../hooks/useAsyncData'
import { loadUserById, recordAuditLog, updateUserAdminFields, type AdminUserDetails } from '../../services/adminData'

interface UserDetailsPageProps {
  userId: string
  onBack: () => void
}

const tabs = [
  'Overview',
  'Activity',
  'Notes and files',
  'Quizzes',
  'Flashcards',
  'AI Tutor usage',
  'Study plans',
  'Notifications',
  'Reports',
  'Security events',
]

export function UserDetailsPage({ userId, onBack }: UserDetailsPageProps) {
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [actionError, setActionError] = useState('')
  const { data: user, error, loading, reload } = useAsyncData<AdminUserDetails | null>(() => loadUserById(userId), null, [userId])

  const usageData = useMemo(
    () => user?.contentUsage ?? [],
    [user],
  )

  if (loading) {
    return <StateBlock type="loading" title="Loading user details" message="Reading this user profile and study subcollections from Firestore." />
  }

  if (error) {
    return <StateBlock type="permission" title="User details unavailable" message={error} actionLabel="Retry" onAction={reload} />
  }

  if (!user) {
    return (
      <StateBlock
        type="empty"
        title="User not found"
        message="The selected account no longer exists or your role cannot access it."
        actionLabel="Back to users"
        onAction={onBack}
      />
    )
  }

  const destructive = pendingAction === 'Suspend account' || pendingAction === 'Schedule deletion'

  const confirmAction = async () => {
    if (!pendingAction) return
    if (destructive && reason.trim().length < 8) return

    try {
      if (pendingAction === 'Suspend account') await updateUserAdminFields(user.id, { status: 'Suspended' })
      if (pendingAction === 'Reactivate account') await updateUserAdminFields(user.id, { status: 'Active', disabled: false })
      if (pendingAction === 'Schedule deletion') await updateUserAdminFields(user.id, { status: 'Deletion pending' })
      await recordAuditLog({
        administrator: 'Current admin',
        action: pendingAction,
        target: user.id,
        previousValue: user.status,
        newValue: pendingAction,
        reason: reason || 'Admin action from user detail page',
        ipAddress: 'Client side',
      })
      setPendingAction(null)
      reload()
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : 'Could not apply this admin action.')
    }
  }

  return (
    <div className="page-stack">
      <section className="profile-header">
        <Button icon="chevron" variant="ghost" onClick={onBack}>Back</Button>
        <div className="profile-summary">
          <span className="avatar large">{user.avatar}</span>
          <div>
            <span>{user.id}</span>
            <h2>{user.fullName}</h2>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="profile-actions">
          {['Suspend account', 'Reactivate account', 'Revoke sessions', 'Reset limit', 'Schedule deletion'].map((action) => (
            <Button
              key={action}
              size="sm"
              variant={action.includes('Suspend') || action.includes('deletion') ? 'danger' : 'secondary'}
              onClick={() => {
                setReason('')
                setActionError('')
                setPendingAction(action)
              }}
            >
              {action}
            </Button>
          ))}
        </div>
      </section>

      <section className="panel">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div className="tab-content">
          {activeTab === 'Overview' ? (
            <div className="details-grid">
              <article>
                <h3>Account details</h3>
                <dl className="detail-list">
                  <div><dt>Status</dt><dd><Badge tone={user.status === 'Active' ? 'good' : 'warning'}>{user.status}</Badge></dd></div>
                  <div><dt>Current role</dt><dd>{user.role}</dd></div>
                  <div><dt>Registration</dt><dd>{user.registrationDate}</dd></div>
                  <div><dt>Last login</dt><dd>{user.lastLogin}</dd></div>
                </dl>
              </article>
              <article>
                <h3>Usage statistics</h3>
                <dl className="detail-list">
                  <div><dt>Notes</dt><dd>{user.noteCount}</dd></div>
                  <div><dt>PDFs</dt><dd>{user.pdfCount}</dd></div>
                  <div><dt>Quizzes</dt><dd>{user.quizzes}</dd></div>
                  <div><dt>Flashcards</dt><dd>{user.flashcards}</dd></div>
                  <div><dt>AI tutor conversations</dt><dd>{user.tutorConversationCount}</dd></div>
                </dl>
              </article>
            </div>
          ) : null}

          {activeTab === 'Activity' ? (
            user.recentActivity.length ? <ActivityList title="Recent activity timeline" items={user.recentActivity} /> : <StateBlock type="empty" title="No recent activity" message="No recent quiz, flashcard, or planner activity was found in Firebase." />
          ) : null}
          {activeTab === 'Notes and files' ? <BarChart title="Uploaded-content totals" subtitle={`${user.semesterCount} semesters and ${user.moduleCount} modules`} data={usageData.slice(0, 2)} /> : null}
          {activeTab === 'Quizzes' ? <StateBlock type={user.quizzes ? 'success' : 'empty'} title="Quiz history" message={user.quizStatus} /> : null}
          {activeTab === 'Flashcards' ? <StateBlock type={user.flashcards ? 'success' : 'empty'} title="Flashcard decks" message={user.flashcardStatus} /> : null}
          {activeTab === 'AI Tutor usage' ? <BarChart title="AI request history" subtitle="Current usage mix for AI-assisted study" data={usageData} percent /> : null}
          {activeTab === 'Study plans' ? <StateBlock type={user.plannerEventCount ? 'warning' : 'empty'} title="Study plan status" message={user.plannerStatus} /> : null}
          {activeTab === 'Notifications' ? <StateBlock type={user.unreadNotifications ? 'warning' : 'success'} title="Notification delivery" message={user.notificationStatus} /> : null}
          {activeTab === 'Reports' ? <StateBlock type={user.reports ? 'warning' : 'empty'} title="Reports associated with this account" message={`${user.reports} reports are linked to this account.`} /> : null}
          {activeTab === 'Security events' ? (
            <div className="details-grid">
              {user.devices.map((device) => (
                <article key={device}>
                  <h3>{device}</h3>
                  <p>Device record loaded from users/{'{uid}'}/devices.</p>
                  <Badge tone="good">Firebase</Badge>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {pendingAction ? (
        <Modal
          danger={destructive}
          title={pendingAction}
          description={`${pendingAction} for ${user.fullName}.`}
          confirmLabel="Record action"
          onClose={() => setPendingAction(null)}
          onConfirm={confirmAction}
        >
          {destructive ? (
            <label>
              Administrator reason
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason required for destructive account action" />
              {reason && reason.trim().length < 8 ? <span className="field-error">Reason must be at least 8 characters.</span> : null}
            </label>
          ) : (
            <p>The action will update Firebase and create an audit entry where supported.</p>
          )}
          {actionError ? <span className="field-error">{actionError}</span> : null}
        </Modal>
      ) : null}
    </div>
  )
}