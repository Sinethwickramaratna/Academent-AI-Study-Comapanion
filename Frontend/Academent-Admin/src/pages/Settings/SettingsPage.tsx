import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StateBlock } from '../../components/ui/StateBlock'
import { useAdmin } from '../../hooks/useAdmin'
import { useAsyncData } from '../../hooks/useAsyncData'
import { initializeDefaultSystemSettings, loadSettings, recordAuditLog, saveSystemSetting } from '../../services/adminData'
import type { SettingItem, SettingSection } from '../../types/admin'

type SettingValue = string | boolean | number

export function SettingsPage() {
  const { session } = useAdmin()
  const { data: sections, error, loading, reload } = useAsyncData<SettingSection[]>(loadSettings, [])
  const initialValues = useMemo(() => {
    const values: Record<string, SettingValue> = {}
    sections.forEach((section) => {
      section.items.forEach((item) => {
        values[item.id] = item.value
      })
    })
    return values
  }, [sections])
  const [values, setValues] = useState<Record<string, SettingValue>>({})
  const [pendingItem, setPendingItem] = useState<SettingItem | null>(null)
  const [reason, setReason] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [initializing, setInitializing] = useState(false)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const setValue = (id: string, value: SettingValue) => {
    setValues((current) => ({ ...current, [id]: value }))
  }

  const saveItem = (item: SettingItem) => {
    setSaveError('')
    if (item.important) {
      setReason('')
      setPendingItem(item)
      return
    }

    void persistItem(item, 'Routine setting update')
  }

  const persistItem = async (item: SettingItem, auditReason: string) => {
    try {
      await saveSystemSetting(item, values[item.id])
      await recordAuditLog({
        administrator: session?.email || 'Current admin',
        action: 'Updated system setting',
        target: item.id,
        previousValue: String(item.value),
        newValue: String(values[item.id]),
        reason: auditReason,
        ipAddress: 'Client side',
      })
      setSavedMessage(`${item.label} saved.`)
      setPendingItem(null)
      reload()
    } catch (nextError) {
      setSaveError(nextError instanceof Error ? nextError.message : 'Could not save this setting.')
    }
  }

  const initializeSettings = async () => {
    setInitializing(true)
    setSaveError('')
    setSavedMessage('')

    try {
      const createdCount = await initializeDefaultSystemSettings()
      await recordAuditLog({
        administrator: session?.email || 'Current admin',
        action: 'Initialized system settings',
        target: 'systemSettings',
        previousValue: 'Missing defaults',
        newValue: `${createdCount} default settings created`,
        reason: 'Admin initialized default Firebase systemSettings documents',
        ipAddress: 'Client side',
      })
      setSavedMessage(createdCount ? `${createdCount} default settings created.` : 'Default settings already exist.')
      await reload()
    } catch (nextError) {
      setSaveError(nextError instanceof Error ? nextError.message : 'Could not initialize default settings.')
    } finally {
      setInitializing(false)
    }
  }

  const confirmSave = () => {
    if (pendingItem && reason.trim().length >= 10) {
      void persistItem(pendingItem, reason.trim())
    }
  }

  if (loading) {
    return <StateBlock type="loading" title="Loading Firebase settings" message="Reading systemSettings documents from Firestore." />
  }

  if (error) {
    return <StateBlock type="permission" title="Settings unavailable" message={error} actionLabel="Retry" onAction={reload} />
  }

  if (!sections.length) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <span>System Settings</span>
            <h2>Configure availability, AI limits, uploads, notifications, and banners</h2>
            <p>Settings are loaded from the Firebase systemSettings collection.</p>
          </div>
          <div className="header-actions">
            {savedMessage ? <Badge tone="good">{savedMessage}</Badge> : null}
            <Button icon="check" variant="primary" disabled={initializing} onClick={initializeSettings}>{initializing ? 'Creating defaults' : 'Initialize defaults'}</Button>
            <Button icon="activity" variant="secondary" onClick={reload}>Refresh settings</Button>
          </div>
        </section>
        {saveError ? <StateBlock type="warning" title="Could not initialize settings" message={saveError} /> : null}
        <StateBlock
          type="empty"
          title="No Firebase settings found"
          message="Create the default systemSettings documents from this page, or add documents manually with label, description, value, sectionTitle, and important fields."
          actionLabel={initializing ? undefined : 'Initialize defaults'}
          onAction={initializeSettings}
        />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span>System Settings</span>
          <h2>Configure availability, AI limits, uploads, notifications, and banners</h2>
          <p>Important system changes require confirmation and an administrator reason.</p>
        </div>
        <div className="header-actions">
          {savedMessage ? <Badge tone="good">{savedMessage}</Badge> : null}
          <Button icon="check" variant="secondary" disabled={initializing} onClick={initializeSettings}>{initializing ? 'Checking defaults' : 'Initialize missing defaults'}</Button>
          <Button icon="activity" variant="secondary" onClick={reload}>Refresh settings</Button>
        </div>
      </section>

      {sections.map((section) => (
        <section className="panel settings-section" key={section.title}>
          <div className="panel-heading">
            <div>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
          </div>
          <div className="settings-list">
            {section.items.map((item) => {
              const value = values[item.id]

              return (
                <article className="setting-row" key={item.id}>
                  <div>
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
                    {item.important ? <Badge tone="warning">Reason required</Badge> : null}
                  </div>
                  <div className="setting-control">
                    {typeof item.value === 'boolean' ? (
                      <label className="switch">
                        <input checked={Boolean(value)} onChange={(event) => setValue(item.id, event.target.checked)} type="checkbox" />
                        <span />
                      </label>
                    ) : typeof item.value === 'number' ? (
                      <input type="number" value={Number(value)} onChange={(event) => setValue(item.id, Number(event.target.value))} />
                    ) : (
                      <input value={String(value ?? '')} onChange={(event) => setValue(item.id, event.target.value)} />
                    )}
                    <Button size="sm" variant="secondary" onClick={() => saveItem(item)}>Save</Button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      {saveError ? <StateBlock type="warning" title="Setting save failed" message={saveError} /> : null}

      {pendingItem ? (
        <Modal
          danger
          title={`Confirm ${pendingItem.label}`}
          description="This change affects production behavior and will be written to audit logs."
          confirmLabel="Save setting"
          onClose={() => setPendingItem(null)}
          onConfirm={confirmSave}
        >
          <label>
            Administrator reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this production setting is changing" />
            {reason && reason.trim().length < 10 ? <span className="field-error">Reason must be at least 10 characters.</span> : null}
          </label>
        </Modal>
      ) : null}
    </div>
  )
}