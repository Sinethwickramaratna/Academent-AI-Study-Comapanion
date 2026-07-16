import type { BarDatum } from '../../types/admin'
import { formatPercent } from '../../utils/format'

export function DonutChart({ title, subtitle, data }: { title: string; subtitle: string; data: BarDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulative = 0
  const gradient = data
    .map((item) => {
      const start = cumulative
      cumulative += (item.value / total) * 100
      return `${item.color} ${start}% ${cumulative}%`
    })
    .join(', ')

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="donut-wrap">
        <div className="donut" style={{ background: `conic-gradient(${gradient})` }}>
          <span>{formatPercent(data[0]?.value ?? 0)}</span>
        </div>
        <div className="chart-legend vertical">
          {data.map((item) => (
            <span key={item.label}>
              <i style={{ backgroundColor: item.color }} />
              {item.label} {formatPercent(item.value)}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
