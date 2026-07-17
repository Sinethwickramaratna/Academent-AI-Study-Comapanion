import { useState } from 'react'
import { AdminShell } from './components/layout/AdminShell'
import { clearAdminFirebaseSession } from './services/auth'
import { recordAuditLog } from './services/adminData'
import { AdminProvider } from './context/AdminContext'
import { useAdmin } from './hooks/useAdmin'
import { DashboardPage } from './pages/Dashboard/DashboardPage'
import { AuditLogsPage } from './pages/Logs/AuditLogsPage'
import { IssueMonitoringPage } from './pages/Logs/IssueMonitoringPage'
import { LogsPage } from './pages/Logs/LogsPage'
import { LoginPage } from './pages/Login/LoginPage'
import { ReportsPage } from './pages/Reports/ReportsPage'
import { AdminRolesPage } from './pages/Settings/AdminRolesPage'
import { SettingsPage } from './pages/Settings/SettingsPage'
import { UserDetailsPage } from './pages/Users/UserDetailsPage'
import { UsersPage } from './pages/Users/UsersPage'
import type { PortalView } from './types/admin'
import './styles/admin.css'

function Portal() {
  const { clearSession, expireSession, session, sessionExpired, setSession } = useAdmin()
  const [activeView, setActiveView] = useState<PortalView>('dashboard')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  if (!session) {
    return (
      <LoginPage
        sessionExpired={sessionExpired}
        onAuthenticated={(adminSession) => {
          clearSession()
          setSession(adminSession)
          setActiveView('dashboard')
          setSelectedUserId(null)
          void recordAuditLog({
            administrator: adminSession.email,
            action: 'Admin signed in',
            target: adminSession.id,
            previousValue: 'Signed out',
            newValue: 'Signed in',
            reason: 'Successful admin portal authentication',
            ipAddress: 'Client side',
          }).catch((error) => {
            console.warn('Admin sign-in audit log could not be created:', error)
          })
        }}
      />
    )
  }

  const navigate = (view: PortalView) => {
    setActiveView(view)
    setSelectedUserId(null)
  }

  const expireAdminSession = () => {
    void clearAdminFirebaseSession()
    expireSession()
  }

  const renderView = () => {
    if (selectedUserId) {
      return <UserDetailsPage userId={selectedUserId} onBack={() => setSelectedUserId(null)} />
    }

    if (activeView === 'dashboard') {
      return <DashboardPage />
    }

    if (activeView === 'users') {
      return <UsersPage onOpenUser={setSelectedUserId} />
    }

    if (activeView === 'logs') {
      return <LogsPage />
    }

    if (activeView === 'issues') {
      return <IssueMonitoringPage />
    }

    if (activeView === 'reports') {
      return <ReportsPage />
    }

    if (activeView === 'audit') {
      return <AuditLogsPage />
    }

    if (activeView === 'admins') {
      return <AdminRolesPage />
    }

    return <SettingsPage />
  }

  return (
    <AdminShell activeView={activeView} session={session} onExpireSession={expireAdminSession} onNavigate={navigate}>
      {renderView()}
    </AdminShell>
  )
}

function App() {
  return (
    <AdminProvider>
      <Portal />
    </AdminProvider>
  )
}

export default App
