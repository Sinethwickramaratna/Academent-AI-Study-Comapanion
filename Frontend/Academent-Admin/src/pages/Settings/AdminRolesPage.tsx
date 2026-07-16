import { useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StateBlock } from '../../components/ui/StateBlock'
import { getAdmins } from '../../services/api'
import type { AdminMember, UserRole } from '../../types/admin'

const adminStatusTone: Record<AdminMember['status'], 'good' | 'warning' | 'danger'> = {
  Enabled: 'good',
  Disabled: 'danger',
  'Invite pending': 'warning',
}

export function AdminRolesPage() {
  const admins = getAdmins()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminMember>(admins[0])

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span>Admin and Role Management</span>
          <h2>Super administrator controls for access, roles, permissions, and MFA</h2>
          <p>Roles include Support Admin, Content Admin, System Admin, and Super Admin.</p>
        </div>
        <Button icon="plus" variant="primary" onClick={() => setInviteOpen(true)}>Invite administrator</Button>
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
                  <tr className={selectedAdmin.id === admin.id ? 'selected' : ''} key={admin.id} onClick={() => setSelectedAdmin(admin)}>
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
            <select defaultValue={selectedAdmin.role}>
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
          <Button icon="check" variant="primary">Save role changes</Button>
        </aside>
      </div>

      <StateBlock type="permission" title="Permission-denied state" message="Non-super administrators see this state instead of role and permission controls." />

      {inviteOpen ? (
        <Modal title="Invite administrator" description="Send an administrator invitation with a required role and MFA policy." confirmLabel="Send invitation" onClose={() => setInviteOpen(false)} onConfirm={() => setInviteOpen(false)}>
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
