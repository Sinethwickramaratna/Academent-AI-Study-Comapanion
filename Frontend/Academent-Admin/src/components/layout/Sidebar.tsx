import type { PortalView } from '../../types/admin'
import { portalRoutes } from '../../routes/routes'
import { classNames } from '../../utils/format'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

interface SidebarProps {
  activeView: PortalView
  collapsed: boolean
  mobileOpen: boolean
  onCollapse: () => void
  onCloseMobile: () => void
  onNavigate: (view: PortalView) => void
}

const groupLabels = {
  monitor: 'Monitor',
  manage: 'Manage',
  govern: 'Govern',
}

export function Sidebar({ activeView, collapsed, mobileOpen, onCollapse, onCloseMobile, onNavigate }: SidebarProps) {
  return (
    <>
      <aside className={classNames('sidebar', collapsed && 'collapsed', mobileOpen && 'mobile-open')}>
        <div className="brand">
          <div className="brand-mark">A</div>
          <div className="brand-copy">
            <strong>Academent</strong>
            <span>Admin Portal</span>
          </div>
          <Button icon="x" variant="ghost" className="mobile-close" aria-label="Close navigation" onClick={onCloseMobile} />
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          {(['monitor', 'manage', 'govern'] as const).map((group) => (
            <div className="nav-group" key={group}>
              <span className="nav-group-label">{groupLabels[group]}</span>
              {portalRoutes
                .filter((route) => route.group === group)
                .map((route) => (
                  <button
                    className={classNames('nav-item', activeView === route.id && 'active')}
                    key={route.id}
                    type="button"
                    onClick={() => onNavigate(route.id)}
                    title={route.label}
                  >
                    <Icon name={route.icon} />
                    <span>{route.label}</span>
                  </button>
                ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Button icon="chevron" variant="ghost" aria-label="Collapse navigation" onClick={onCollapse}>
            <span className="collapse-label">Collapse</span>
          </Button>
        </div>
      </aside>
      {mobileOpen ? <button className="drawer-scrim" type="button" aria-label="Close navigation" onClick={onCloseMobile} /> : null}
    </>
  )
}
