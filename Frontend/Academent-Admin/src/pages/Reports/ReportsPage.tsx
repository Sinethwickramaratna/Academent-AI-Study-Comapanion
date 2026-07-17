import { useEffect, useMemo, useState } from 'react'
import { ActivityList } from '../../components/common/ActivityList'
import { FilterBar } from '../../components/common/FilterBar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StateBlock } from '../../components/ui/StateBlock'
import { useAdmin } from '../../hooks/useAdmin'
import { useAsyncData } from '../../hooks/useAsyncData'
import { loadReports, recordAuditLog, updateReportFields } from '../../services/adminData'
import type { Report, ReportStatus } from '../../types/admin'

const priorityTone: Record<Report['priority'], 'good' | 'neutral' | 'warning' | 'danger'> = {
  Low: 'good',
  Medium: 'neutral',
  High: 'warning',
  Urgent: 'danger',
}

const reportStatuses: ReportStatus[] = ['Open', 'Assigned', 'Waiting on user', 'Resolved', 'Closed']

export function ReportsPage() {
  const { session } = useAdmin()
  const { data: reports, error, loading, reload } = useAsyncData<Report[]>(loadReports, [])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [status, setStatus] = useState('All statuses')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [responseOpen, setResponseOpen] = useState(false)
  const [assignedAdmin, setAssignedAdmin] = useState('Support queue')
  const [reportStatus, setReportStatus] = useState<ReportStatus>('Open')
  const [internalNotes, setInternalNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    setSelectedReport((current) => current && reports.some((report) => report.id === current.id) ? current : reports[0] ?? null)
  }, [reports])

  useEffect(() => {
    if (!selectedReport) return
    setAssignedAdmin(selectedReport.assignedAdmin)
    setReportStatus(selectedReport.status)
    setInternalNotes(selectedReport.notes)
    setSaveError('')
    setSaveMessage('')
  }, [selectedReport])

  const filteredReports = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return reports.filter((report) => {
      const matchesSearch = !normalized || `${report.reporter} ${report.preview} ${report.id}`.toLowerCase().includes(normalized)
      const matchesCategory = category === 'All categories' || report.category === category
      const matchesStatus = status === 'All statuses' || report.status === status

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [category, reports, search, status])

  const saveReport = async () => {
    if (!selectedReport) return

    setSaving(true)
    setSaveError('')
    setSaveMessage('')

    try {
      await updateReportFields(selectedReport, {
        assignedAdmin,
        notes: internalNotes,
        status: reportStatus,
      })
      await recordAuditLog({
        administrator: session?.email || 'Current admin',
        action: 'Updated report',
        target: selectedReport.id,
        previousValue: selectedReport.status,
        newValue: reportStatus,
        reason: internalNotes || 'Report queue update',
        ipAddress: 'Client side',
      })
      setSaveMessage('Report saved to Firebase.')
      await reload()
    } catch (nextError) {
      setSaveError(nextError instanceof Error ? nextError.message : 'Could not save report changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <StateBlock type="loading" title="Loading Firebase reports" message="Reading report documents from userReports and reports collections." />
  }

  if (error) {
    return <StateBlock type="permission" title="Reports unavailable" message={error} actionLabel="Retry" onAction={reload} />
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span>User Reports and Feedback</span>
          <h2>Bug reports, content problems, AI answer issues, requests, and account cases</h2>
          <p>Review reporter context, attachments, internal notes, status changes, and response workflow from Firebase.</p>
        </div>
        <Button icon="activity" variant="secondary" onClick={reload}>Refresh reports</Button>
      </section>

      <FilterBar>
        <input type="search" placeholder="Search reports" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option>All categories</option>
          <option>Bug report</option>
          <option>Content problem</option>
          <option>AI answer problem</option>
          <option>Feature request</option>
          <option>Account issue</option>
          <option>General feedback</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All statuses</option>
          {reportStatuses.map((item) => <option key={item}>{item}</option>)}
        </select>
      </FilterBar>

      <div className="split-workspace">
        <section className="panel data-panel">
          <div className="panel-heading">
            <div>
              <h2>Report queue</h2>
              <p>{filteredReports.length} matching reports</p>
            </div>
          </div>
          {filteredReports.length ? (
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Reporter</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Message preview</th>
                    <th>Submitted</th>
                    <th>Assigned administrator</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr className={selectedReport?.id === report.id ? 'selected' : ''} key={`${report.sourceCollection || 'report'}-${report.id}`} onClick={() => setSelectedReport(report)}>
                      <td data-label="Reporter">{report.reporter}</td>
                      <td data-label="Category">{report.category}</td>
                      <td data-label="Priority"><Badge tone={priorityTone[report.priority]}>{report.priority}</Badge></td>
                      <td data-label="Message preview">{report.preview}</td>
                      <td data-label="Submitted">{report.submittedDate}</td>
                      <td data-label="Assigned administrator">{report.assignedAdmin}</td>
                      <td data-label="Status"><Badge tone="purple">{report.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <StateBlock type="empty" title="No Firebase reports" message="No report documents were found. The main website needs a report/feedback form that writes to userReports or reports." />
          )}
        </section>

        <aside className="side-panel report-detail">
          {selectedReport ? (
            <>
              <div className="side-panel-heading">
                <div>
                  <h2>{selectedReport.category}</h2>
                  <p>{selectedReport.sourceCollection || 'report'} / {selectedReport.id}</p>
                </div>
                <Badge tone={priorityTone[selectedReport.priority]}>{selectedReport.priority}</Badge>
              </div>
              <p className="report-preview">{selectedReport.preview}</p>
              <dl className="detail-list">
                <div><dt>Reporter</dt><dd>{selectedReport.reporter}</dd></div>
                <div><dt>Submitted</dt><dd>{selectedReport.submittedDate}</dd></div>
                <div><dt>Status</dt><dd>{selectedReport.status}</dd></div>
              </dl>
              <section className="attachment-list">
                <h3>Attachments and screenshots</h3>
                {selectedReport.attachments.length ? (
                  selectedReport.attachments.map((attachment) => <span key={attachment}>{attachment}</span>)
                ) : (
                  <p>No attachments submitted.</p>
                )}
              </section>
              <ActivityList title="Conversation history and status changes" items={selectedReport.conversation} />
              <div className="control-grid single-column">
                <label>
                  Assigned administrator
                  <input value={assignedAdmin} onChange={(event) => setAssignedAdmin(event.target.value)} />
                </label>
                <label>
                  Status
                  <select value={reportStatus} onChange={(event) => setReportStatus(event.target.value as ReportStatus)}>
                    {reportStatuses.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  Internal notes
                  <textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} />
                </label>
              </div>
              <div className="form-footer">
                {saveError ? <span className="field-error">{saveError}</span> : null}
                {saveMessage ? <span className="field-success">{saveMessage}</span> : null}
                <Button icon="check" variant="primary" disabled={saving} onClick={saveReport}>{saving ? 'Saving report' : 'Save report'}</Button>
                <Button icon="reports" variant="secondary" onClick={() => setResponseOpen(true)}>Respond to user</Button>
              </div>
            </>
          ) : (
            <StateBlock type="empty" title="Select a report" message="Choose a Firebase report document to inspect details." />
          )}
        </aside>
      </div>

      {responseOpen && selectedReport ? (
        <Modal title="Response to user" description={`Send a response to ${selectedReport.reporter}.`} confirmLabel="Close" onClose={() => setResponseOpen(false)} onConfirm={() => setResponseOpen(false)}>
          <label>
            Message
            <textarea placeholder="Write a concise support response with next steps" />
          </label>
          <p className="form-help">Response delivery is not connected yet. Save status and internal notes from the report detail panel.</p>
        </Modal>
      ) : null}
    </div>
  )
}