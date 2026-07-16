import type { PortalView } from '../types/admin'

export interface PortalRoute {
  id: PortalView
  label: string
  icon: string
  group: 'monitor' | 'manage' | 'govern'
}

export const portalRoutes: PortalRoute[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', group: 'monitor' },
  { id: 'logs', label: 'System Logs', icon: 'logs', group: 'monitor' },
  { id: 'issues', label: 'Issue Monitoring', icon: 'alert', group: 'monitor' },
  { id: 'users', label: 'Users', icon: 'users', group: 'manage' },
  { id: 'reports', label: 'Reports', icon: 'reports', group: 'manage' },
  { id: 'audit', label: 'Audit Logs', icon: 'lock', group: 'govern' },
  { id: 'admins', label: 'Admins & Roles', icon: 'shield', group: 'govern' },
  { id: 'settings', label: 'System Settings', icon: 'settings', group: 'govern' },
]
