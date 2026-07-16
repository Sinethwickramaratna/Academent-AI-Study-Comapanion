import { useMemo, useState } from 'react'
import type { AdminSession, PortalView } from '../../types/admin'
import { portalRoutes } from '../../routes/routes'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

interface TopbarProps {
  activeView: PortalView
  session: AdminSession
  onExpireSession: () => void
  onOpenMobile: () => void
}

export function Topbar({ activeView, session, onExpireSession, onOpenMobile }: TopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const title = useMemo(() => portalRoutes.find((route) => route.id === activeView)?.label ?? 'Dashboard', [activeView])

  return (
    <header className="topbar">
      <div className="topbar-title">
        <Button icon="menu" variant="ghost" className="menu-button" aria-label="Open navigation" onClick={onOpenMobile} />
        <div>
          <span>Production</span>
          <h1>{title}</h1>
        </div>
      </div>

      <label className="global-search">
        <Icon name="search" />
        <input type="search" placeholder="Search users, logs, reports" />
      </label>

      <div className="topbar-actions">
        <select aria-label="Date range">
          <option>Last 24 hours</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Custom range</option>
        </select>
        <Button icon="refresh" variant="secondary">Refresh</Button>
        <div className="popover-wrap">
          <Button icon="bell" variant="ghost" aria-label="Open notifications" onClick={() => setNotificationsOpen((open) => !open)} />
          {notificationsOpen ? (
            <section className="popover notification-panel">
              <h2>Notifications</h2>
              <article>
                <strong>Partial service outage</strong>
                <span>Push notifications are retrying at a higher rate.</span>
              </article>
              <article>
                <strong>Critical issue assigned</strong>
                <span>Quiz worker timeout is waiting for investigation.</span>
              </article>
            </section>
          ) : null}
        </div>
        <div className="popover-wrap">
          <button className="profile-button" type="button" onClick={() => setProfileOpen((open) => !open)}>
            <span>{session.avatar}</span>
            <div>
              <strong>{session.name}</strong>
              <small>{session.role}</small>
            </div>
          </button>
          {profileOpen ? (
            <section className="popover profile-menu">
              <h2>Admin Profile</h2>
              <p>{session.email}</p>
              <Button icon="lock" variant="ghost" onClick={onExpireSession}>End session</Button>
            </section>
          ) : null}
        </div>
      </div>
    </header>
  )
}
