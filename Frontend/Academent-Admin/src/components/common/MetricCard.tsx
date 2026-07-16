import type { Metric } from '../../types/admin'
import { Badge } from '../ui/Badge'
import { Icon } from '../ui/Icon'

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className="metric-card">
      <div className="metric-card-top">
        <span className={`metric-icon metric-${metric.tone}`}>
          <Icon name={metric.icon} />
        </span>
        <Badge tone={metric.tone}>{metric.change}</Badge>
      </div>
      <strong>{metric.value}</strong>
      <span>{metric.label}</span>
    </article>
  )
}
