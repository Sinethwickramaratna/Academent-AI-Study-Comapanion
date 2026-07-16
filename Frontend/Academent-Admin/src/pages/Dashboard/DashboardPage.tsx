import { ActivityList } from '../../components/common/ActivityList'
import { MetricCard } from '../../components/common/MetricCard'
import { BarChart } from '../../components/charts/BarChart'
import { DonutChart } from '../../components/charts/DonutChart'
import { LineChart } from '../../components/charts/LineChart'
import { Badge } from '../../components/ui/Badge'
import { StateBlock } from '../../components/ui/StateBlock'
import { getDashboardSnapshot } from '../../services/api'
import { getFirebaseEnvironmentLabel } from '../../services/firebase'

const healthTone = {
  Operational: 'good',
  Degraded: 'warning',
  Offline: 'danger',
  Investigating: 'warning',
} as const

export function DashboardPage() {
  const dashboard = getDashboardSnapshot()

  return (
    <div className="page-stack">
      <section className="hero-strip">
        <div>
          <span>{getFirebaseEnvironmentLabel()}</span>
          <h2>Production education platform monitoring</h2>
          <p>Track students, AI workloads, system reliability, reports, and administrator actions from one operational surface.</p>
        </div>
        <div className="hero-status">
          <strong>99.94%</strong>
          <span>30-day platform availability</span>
        </div>
      </section>

      <section className="metric-grid">
        {dashboard.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <div className="dashboard-grid">
        <LineChart title="User-growth line chart" subtitle="Total and active users over the last 7 periods" series={dashboard.userGrowth} />
        <BarChart title="Daily active-user chart" subtitle="Active users by weekday" data={dashboard.activeUsers} />
        <BarChart title="AI request-volume chart" subtitle="Requests by AI-powered feature" data={dashboard.aiRequests} />
        <LineChart title="Error-frequency chart" subtitle="Warnings and errors after latest deploy" series={dashboard.errors} />
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

      <div className="state-grid">
        <StateBlock type="loading" title="Loading skeletons" message="Tables and dashboard cards reserve space while admin data loads." />
        <StateBlock type="offline" title="Backend offline" message="API data is unavailable. Cached metrics remain visible for triage." />
        <StateBlock type="outage" title="Partial service outage" message="Notifications are degraded while Auth, Firestore, and Gemini remain operational." />
      </div>
    </div>
  )
}
