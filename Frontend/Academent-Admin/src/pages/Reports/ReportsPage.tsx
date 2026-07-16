import { useMemo, useState } from 'react'
import { ActivityList } from '../../components/common/ActivityList'
import { FilterBar } from '../../components/common/FilterBar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StateBlock } from '../../components/ui/StateBlock'
import { getReports } from '../../services/api'
import type { Report } from '../../types/admin'

const priorityTone: Record<Report['priority'], 'good' | 'neutral' | 'warning' | 'danger'> = {
  Low: 'good',
  Medium: 'neutral',
  High: 'warning',
  Urgent: 'danger',
}

export function ReportsPage() {
  const reports = getReports()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [status, setStatus] = useState('All statuses')
  const [selectedReport, setSelectedReport] = useState<Report>(reports[0])
  const [responseOpen, setResponseOpen] = useState(false)

  const filteredReports = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return reports.filter((report) => {
      const matchesSearch = !normalized || `${report.reporter} ${report.preview} ${report.id}`.toLowerCase().includes(normalized)
      const matchesCategory = category === 'All categories' || report.category === category
      const matchesStatus = status === 'All statuses' || report.status === status

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [category, reports, search, status])

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span>User Reports and Feedback</span>
          <h2>Bug reports, content problems, AI answer issues, requests, and account cases</h2>
          <p>Review reporter context, attachments, internal notes, status changes, and response workflow.</p>
        </div>
        <Button icon="download" variant="secondary">Export reports</Button>
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
          <option>Open</option>
          <option>Assigned</option>
          <option>Waiting on user</option>
          <option>Resolved</option>
          <option>Closed</option>
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
                    <tr className={selectedReport.id === report.id ? 'selected' : ''} key={report.id} onClick={() => setSelectedReport(report)}>
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
            <StateBlock type="no-results" title="No reports found" message="Try a different category, status, or search term." />
          )}
        </section>

        <aside className="side-panel report-detail">
          <div className="side-panel-heading">
            <div>
              <h2>{selectedReport.category}</h2>
              <p>{selectedReport.id}</p>
            </div>
            <Badge tone={priorityTone[selectedReport.priority]}>{selectedReport.priority}</Badge>
          </div>
          <p className="report-preview">{selectedReport.preview}</p>
          <dl className="detail-list">
            <div><dt>Reporter</dt><dd>{selectedReport.reporter}</dd></div>
            <div><dt>Assigned administrator</dt><dd>{selectedReport.assignedAdmin}</dd></div>
            <div><dt>Status</dt><dd>{selectedReport.status}</dd></div>
            <div><dt>Internal notes</dt><dd>{selectedReport.notes}</dd></div>
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
          <label>
            Internal notes
            <textarea defaultValue={selectedReport.notes} />
          </label>
          <Button icon="reports" variant="primary" onClick={() => setResponseOpen(true)}>Respond to user</Button>
        </aside>
      </div>

      {responseOpen ? (
        <Modal title="Response to user" description={`Send a response to ${selectedReport.reporter}.`} confirmLabel="Send response" onClose={() => setResponseOpen(false)} onConfirm={() => setResponseOpen(false)}>
          <label>
            Message
            <textarea placeholder="Write a concise support response with next steps" />
          </label>
        </Modal>
      ) : null}
    </div>
  )
}
