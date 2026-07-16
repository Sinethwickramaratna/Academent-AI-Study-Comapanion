import { classNames } from '../../utils/format'

interface BadgeProps {
  children: string
  tone?: 'good' | 'neutral' | 'warning' | 'danger' | 'purple'
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={classNames('badge', `badge-${tone}`)}>{children}</span>
}
