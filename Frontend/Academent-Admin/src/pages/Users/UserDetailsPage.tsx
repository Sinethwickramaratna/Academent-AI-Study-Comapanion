import { useMemo, useState } from 'react'
import { ActivityList } from '../../components/common/ActivityList'
import { BarChart } from '../../components/charts/BarChart'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StateBlock } from '../../components/ui/StateBlock'
import { Tabs } from '../../components/ui/Tabs'
import { getUserById } from '../../services/api'
import type { ActivityItem } from '../../types/admin'

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

const timeline: ActivityItem[] = [
  { title: 'AI Tutor session completed', description: 'Generated a grounded explanation for thermodynamics revision.', time: '22 min ago', tone: 'good' },
  { title: 'Quiz generated', description: 'Created a 20-question mixed difficulty quiz from uploaded notes.', time: '51 min ago', tone: 'neutral' },
  { title: 'Failed upload attempt', description: 'Unsupported file type was rejected by upload guard.', time: '2 hr ago', tone: 'warning' },
]

export function UserDetailsPage({ userId, onBack }: UserDetailsPageProps) {
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const user = getUserById(userId)

  const usageData = useMemo(
    () => [
      { label: 'AI Tutor', value: user?.aiUsage ?? 0, color: '#4D2B8C' },
      { label: 'Notes', value: user?.uploadedNotes ?? 0, color: '#85409D' },
      { label: 'Quizzes', value: user?.quizzes ?? 0, color: '#EEA727' },
      { label: 'Flashcards', value: user?.flashcards ?? 0, color: '#1f9d8a' },
    ],
    [user],
  )

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
                  <div><dt>Uploaded content</dt><dd>{user.uploadedNotes} notes and files</dd></div>
                  <div><dt>Quizzes</dt><dd>{user.quizzes}</dd></div>
                  <div><dt>Flashcards</dt><dd>{user.flashcards}</dd></div>
                  <div><dt>Reports</dt><dd>{user.reports}</dd></div>
                </dl>
              </article>
            </div>
          ) : null}

          {activeTab === 'Activity' ? <ActivityList title="Recent activity timeline" items={timeline} /> : null}
          {activeTab === 'Notes and files' ? <BarChart title="Uploaded-content totals" subtitle="Notes, parsed files, and storage activity" data={usageData.slice(1)} /> : null}
          {activeTab === 'Quizzes' ? <StateBlock type="success" title="Quiz history loaded" message={`${user.fullName} generated ${user.quizzes} quizzes with 3 failed actions this month.`} /> : null}
          {activeTab === 'Flashcards' ? <StateBlock type="empty" title="Flashcard decks" message={`${user.flashcards} generated flashcards across 14 active decks.`} /> : null}
          {activeTab === 'AI Tutor usage' ? <BarChart title="AI request history" subtitle="Current usage mix for AI-assisted study" data={usageData} percent /> : null}
          {activeTab === 'Study plans' ? <StateBlock type="warning" title="Study plan status" message="Two upcoming reminders and one overdue revision block are active." /> : null}
          {activeTab === 'Notifications' ? <StateBlock type="outage" title="Notification delivery" message="Push delivery is degraded for one registered Android device." /> : null}
          {activeTab === 'Reports' ? <StateBlock type={user.reports ? 'warning' : 'empty'} title="Reports associated with this account" message={`${user.reports} reports are linked to this account.`} /> : null}
          {activeTab === 'Security events' ? (
            <div className="details-grid">
              {user.devices.map((device) => (
                <article key={device}>
                  <h3>{device}</h3>
                  <p>Trusted login device with recent session activity.</p>
                  <Badge tone="good">Verified</Badge>
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
          onConfirm={() => {
            if (destructive && reason.trim().length < 8) {
              return
            }
            setPendingAction(null)
          }}
        >
          {destructive ? (
            <label>
              Administrator reason
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason required for destructive account action" />
              {reason && reason.trim().length < 8 ? <span className="field-error">Reason must be at least 8 characters.</span> : null}
            </label>
          ) : (
            <p>The action will revoke or update user access and create an audit entry.</p>
          )}
        </Modal>
      ) : null}
    </div>
  )
}
