import type { ActivityItem } from '../../types/admin'
import { Badge } from '../ui/Badge'

export function ActivityList({ title, items }: { title: string; items: ActivityItem[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      <div className="activity-list">
        {items.map((item) => (
          <article className="activity-item" key={`${item.title}-${item.time}`}>
            <span className={`activity-dot dot-${item.tone}`} />
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <Badge tone={item.tone}>{item.time}</Badge>
          </article>
        ))}
      </div>
    </section>
  )
}
