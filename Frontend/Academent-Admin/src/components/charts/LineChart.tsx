import type { ChartSeries } from '../../types/admin'

interface LineChartProps {
  title: string
  subtitle: string
  series: ChartSeries[]
}

function buildPath(points: number[], width: number, height: number) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = width / Math.max(points.length - 1, 1)

  return points
    .map((point, index) => {
      const x = index * step
      const y = height - ((point - min) / range) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export function LineChart({ title, subtitle, series }: LineChartProps) {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <svg className="line-chart" viewBox="0 0 360 180" role="img" aria-label={title}>
        <g className="chart-grid">
          {[0, 1, 2, 3].map((line) => (
            <line key={line} x1="0" x2="360" y1={line * 45} y2={line * 45} />
          ))}
        </g>
        {series.map((item) => (
          <path key={item.label} d={buildPath(item.points, 360, 150)} stroke={item.color} />
        ))}
      </svg>
      <div className="chart-legend">
        {series.map((item) => (
          <span key={item.label}>
            <i style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  )
}
