import { Button } from './Button'
import { Icon } from './Icon'

interface StateBlockProps {
  type: 'loading' | 'empty' | 'no-results' | 'permission' | 'offline' | 'outage' | 'success' | 'warning' | 'expired'
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

const iconByType: Record<StateBlockProps['type'], string> = {
  loading: 'activity',
  empty: 'file',
  'no-results': 'search',
  permission: 'lock',
  offline: 'server',
  outage: 'alert',
  success: 'check',
  warning: 'alert',
  expired: 'lock',
}

export function StateBlock({ type, title, message, actionLabel, onAction }: StateBlockProps) {
  return (
    <section className={`state-block state-${type}`}>
      <Icon name={iconByType[type]} className="state-icon" />
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      {type === 'loading' ? (
        <div className="skeleton-stack" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </section>
  )
}
