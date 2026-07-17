import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StateBlock } from '../../components/ui/StateBlock'
import { useAsyncData } from '../../hooks/useAsyncData'
import { loadAdmins, recordAuditLog, updateUserAdminFields } from '../../services/adminData'
import type { AdminMember, UserRole } from '../../types/admin'

const adminStatusTone: Record<AdminMember['status'], 'good' | 'warning' | 'danger'> = {
  Enabled: 'good',
  Disabled: 'danger',
  'Invite pending': 'warning',
}

export function AdminRolesPage() {
  const { data: admins, error, loading, reload } = useAsyncData<AdminMember[]>(loadAdmins, [])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminMember | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('Support Admin')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const nextSelected = selectedAdmin && admins.some((admin) => admin.id === selectedAdmin.id) ? selectedAdmin : admins[0] ?? null
    setSelectedAdmin(nextSelected)
    if (nextSelected) setSelectedRole(nextSelected.role)
  }, [admins, selectedAdmin])

  const saveRole = async () => {
    if (!selectedAdmin) return
    setSaveError('')

    try {
      await updateUserAdminFields(selectedAdmin.id, { role: selectedRole })
      await recordAuditLog({
        administrator: 'Current admin',
        action: 'Changed role',
        target: selectedAdmin.id,
        previousValue: selectedAdmin.role,
        newValue: selectedRole,
        reason: 'Role changed from admin role management',
        ipAddress: 'Client side',
      })
      reload()
    } catch (nextError) {
      setSaveError(nextError instanceof Error ? nextError.message : 'Could not save role changes.')
    }
  }

  if (loading) {
    return <StateBlock type="loading" title="Loading Firebase admins" message="Reading admin users from the users collection." />
  }

  if (error) {
    return <StateBlock type="permission" title="Admin role data unavailable" message={error} actionLabel="Retry" onAction={reload} />
  }

  if (!admins.length || !selectedAdmin) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <span>Admin and Role Management</span>
            <h2>Super administrator controls for access, roles, permissions, and MFA</h2>
            <p>Admin accounts are discovered from users with an admin role or Academent email.</p>
          </div>
          <Button icon="activity" variant="secondary" onClick={reload}>Refresh admins</Button>
        </section>
        <StateBlock type="empty" title="No Firebase admins found" message="Add role: Super Admin to a users/{uid} document or use a verified @academent.ai account." />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span>Admin and Role Management</span>
          <h2>Super administrator controls for access, roles, permissions, and MFA</h2>
          <p>Roles are loaded from Firebase users documents.</p>
        </div>
        <div className="header-actions">
          <Button icon="activity" variant="secondary" onClick={reload}>Refresh admins</Button>
          <Button icon="plus" variant="primary" onClick={() => setInviteOpen(true)}>Invite administrator</Button>
        </div>
      </section>

      <div className="split-workspace">
        <section className="panel data-panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>MFA</th>
                  <th>Last active</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr className={selectedAdmin.id === admin.id ? 'selected' : ''} key={admin.id} onClick={() => {
                    setSelectedAdmin(admin)
                    setSelectedRole(admin.role)
                  }}>
                    <td data-label="Administrator">{admin.name}</td>
                    <td data-label="Email">{admin.email}</td>
                    <td data-label="Role">{admin.role}</td>
                    <td data-label="Status"><Badge tone={adminStatusTone[admin.status]}>{admin.status}</Badge></td>
                    <td data-label="MFA"><Badge tone={admin.mfaRequired ? 'good' : 'danger'}>{admin.mfaRequired ? 'Required' : 'Optional'}</Badge></td>
                    <td data-label="Last active">{admin.lastActive}</td>
                    <td data-label="Activity">{admin.activityScore}</td>
                    <td data-label="Actions">
                      <div className="action-row">
                        <Button size="sm" variant="ghost">Activity</Button>
                        <Button size="sm" variant="danger">Disable</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="side-panel">
          <div className="side-panel-heading">
            <div>
              <h2>{selectedAdmin.name}</h2>
              <p>{selectedAdmin.email}</p>
            </div>
            <Badge tone="purple">{selectedAdmin.role}</Badge>
          </div>
          <label>
            Assign role
            <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as UserRole)}>
              {(['Support Admin', 'Content Admin', 'System Admin', 'Super Admin'] as UserRole[]).map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <div className="permission-list">
            <h3>Edit permissions</h3>
            {['User support', 'Reports', 'Logs', 'System settings', 'Role management', 'Audit access'].map((permission) => (
              <label className="checkbox-row" key={permission}>
                <input defaultChecked={selectedAdmin.permissions.includes(permission)} type="checkbox" />
                {permission}
              </label>
            ))}
          </div>
          <label className="toggle-row">
            <input defaultChecked={selectedAdmin.mfaRequired} type="checkbox" />
            Require multi-factor authentication
          </label>
          {saveError ? <span className="field-error">{saveError}</span> : null}
          <Button icon="check" variant="primary" onClick={saveRole}>Save role changes</Button>
        </aside>
      </div>

      <StateBlock type="permission" title="Permission-denied state" message="Non-super administrators see this state instead of role and permission controls." />

      {inviteOpen ? (
        <Modal title="Invite administrator" description="Create a Firebase Auth user first, then add the selected role to users/{uid}." confirmLabel="Close" onClose={() => setInviteOpen(false)} onConfirm={() => setInviteOpen(false)}>
          <div className="control-grid">
            <label>
              Email address
              <input type="email" placeholder="name@academent.ai" />
            </label>
            <label>
              Role
              <select>
                <option>Support Admin</option>
                <option>Content Admin</option>
                <option>System Admin</option>
                <option>Super Admin</option>
              </select>
            </label>
            <label className="checkbox-row">
              <input defaultChecked type="checkbox" />
              Require MFA before first access
            </label>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}