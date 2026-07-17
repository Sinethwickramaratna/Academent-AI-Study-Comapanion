import { ActivityList } from '../../components/common/ActivityList'
import { MetricCard } from '../../components/common/MetricCard'
import { BarChart } from '../../components/charts/BarChart'
import { DonutChart } from '../../components/charts/DonutChart'
import { LineChart } from '../../components/charts/LineChart'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { StateBlock } from '../../components/ui/StateBlock'
import { useAsyncData } from '../../hooks/useAsyncData'
import { loadDashboardSnapshot, type DashboardSnapshot } from '../../services/adminData'
import { getFirebaseEnvironmentLabel } from '../../services/firebase'

const healthTone = {
  Operational: 'good',
  Degraded: 'warning',
  Offline: 'danger',
  Investigating: 'warning',
} as const

const emptyDashboard: DashboardSnapshot = {
  metrics: [],
  userGrowth: [],
  activeUsers: [],
  aiRequests: [],
  errors: [],
  featureUsage: [],
  incidents: [],
  registrations: [],
  adminActions: [],
  health: [],
}

export function DashboardPage() {
  const { data: dashboard, error, loading, reload } = useAsyncData(loadDashboardSnapshot, emptyDashboard)

  if (loading) {
    return <StateBlock type="loading" title="Loading Firebase dashboard" message="Reading users, logs, reports, audit events, and learning activity from Firestore." />
  }

  if (error) {
    return <StateBlock type="permission" title="Dashboard data unavailable" message={error} actionLabel="Retry" onAction={reload} />
  }

  return (
    <div className="page-stack">
      <section className="hero-strip">
        <div>
          <span>{getFirebaseEnvironmentLabel()}</span>
          <h2>Production education platform monitoring</h2>
          <p>Live Firebase view of students, AI workloads, system reliability, reports, and administrator actions.</p>
        </div>
        <div className="hero-status">
          <strong>{dashboard.health.filter((service) => service.status === 'Operational').length}/{dashboard.health.length || 1}</strong>
          <span>services without open errors</span>
        </div>
      </section>

      {dashboard.metrics.length ? (
        <section className="metric-grid">
          {dashboard.metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>
      ) : (
        <StateBlock type="empty" title="No dashboard metrics" message="Firestore returned no admin dashboard data yet." />
      )}

      <div className="dashboard-grid">
        <LineChart title="User-growth line chart" subtitle="New user documents over recent periods" series={dashboard.userGrowth} />
        <BarChart title="Daily active-user chart" subtitle="Users grouped by last-active weekday" data={dashboard.activeUsers} />
        <BarChart title="AI request-volume chart" subtitle="Counts from tutor, quiz, flashcard, and note collections" data={dashboard.aiRequests} />
        <LineChart title="Error-frequency chart" subtitle="Warnings and errors from systemLogs" series={dashboard.errors} />
        <DonutChart title="Feature-usage chart" subtitle="Share of high-volume product workflows" data={dashboard.featureUsage} />
        <section className="panel">
          <div className="panel-heading">
            <h2>System-health status cards</h2>
          </div>
          <div className="health-grid">
            {dashboard.health.map((service) => (
              <article className="health-card" key={service.service}>
                <div>
                  <h3>{service.service}</h3>
                  <Badge tone={healthTone[service.status]}>{service.status}</Badge>
                </div>
                <dl>
                  <div>
                    <dt>Latency</dt>
                    <dd>{service.latency}</dd>
                  </div>
                  <div>
                    <dt>Uptime</dt>
                    <dd>{service.uptime}</dd>
                  </div>
                </dl>
                <p>{service.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="three-column">
        <ActivityList title="Recent system incidents" items={dashboard.incidents} />
        <ActivityList title="Recent registrations" items={dashboard.registrations} />
        <ActivityList title="Recent admin actions" items={dashboard.adminActions} />
      </div>

      <div className="header-actions">
        <Button icon="activity" variant="secondary" onClick={reload}>Refresh Firebase data</Button>
      </div>
    </div>
  )
}