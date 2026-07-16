import { useState, type ReactNode } from 'react'
import type { AdminSession, PortalView } from '../../types/admin'
import { useResponsive } from '../../hooks/useResponsive'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AdminShellProps {
  activeView: PortalView
  children: ReactNode
  session: AdminSession
  onExpireSession: () => void
  onNavigate: (view: PortalView) => void
}

export function AdminShell({ activeView, children, session, onExpireSession, onNavigate }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isMobile } = useResponsive()

  const navigate = (view: PortalView) => {
    onNavigate(view)
    setMobileOpen(false)
  }

  return (
    <div className="admin-shell">
      <Sidebar
        activeView={activeView}
        collapsed={!isMobile && collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
        onNavigate={navigate}
      />
      <div className="app-frame">
        <Topbar activeView={activeView} session={session} onExpireSession={onExpireSession} onOpenMobile={() => setMobileOpen(true)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
