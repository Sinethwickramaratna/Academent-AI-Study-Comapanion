import type { BarDatum } from '../../types/admin'
import { formatPercent } from '../../utils/format'

interface BarChartProps {
  title: string
  subtitle: string
  data: BarDatum[]
  percent?: boolean
}

export function BarChart({ title, subtitle, data, percent }: BarChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="bar-chart">
        {data.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track">
              <i style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }} />
            </div>
            <strong>{percent ? formatPercent(item.value) : item.value.toLocaleString()}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
