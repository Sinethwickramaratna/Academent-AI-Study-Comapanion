import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StateBlock } from '../../components/ui/StateBlock'
import { getSettings } from '../../services/api'
import type { SettingItem } from '../../types/admin'

type SettingValue = string | boolean | number

export function SettingsPage() {
  const sections = getSettings()
  const initialValues = useMemo(() => {
    const values: Record<string, SettingValue> = {}
    sections.forEach((section) => {
      section.items.forEach((item) => {
        values[item.id] = item.value
      })
    })
    return values
  }, [sections])
  const [values, setValues] = useState<Record<string, SettingValue>>(initialValues)
  const [pendingItem, setPendingItem] = useState<SettingItem | null>(null)
  const [reason, setReason] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const setValue = (id: string, value: SettingValue) => {
    setValues((current) => ({ ...current, [id]: value }))
  }

  const saveItem = (item: SettingItem) => {
    if (item.important) {
      setReason('')
      setPendingItem(item)
      return
    }

    setSavedMessage(`${item.label} saved.`)
  }

  const confirmSave = () => {
    if (pendingItem && reason.trim().length >= 10) {
      setSavedMessage(`${pendingItem.label} saved with audit reason.`)
      setPendingItem(null)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span>System Settings</span>
          <h2>Configure availability, AI limits, uploads, notifications, and banners</h2>
          <p>Important system changes require confirmation and an administrator reason.</p>
        </div>
        {savedMessage ? <Badge tone="good">{savedMessage}</Badge> : null}
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
                      <input value={String(value)} onChange={(event) => setValue(item.id, event.target.value)} />
                    )}
                    <Button size="sm" variant="secondary" onClick={() => saveItem(item)}>Save</Button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      <div className="state-grid">
        <StateBlock type="warning" title="Warning dialog state" message="Important settings open a confirmation dialog before saving." />
        <StateBlock type="success" title="Success notification state" message="Saved settings display confirmation feedback in the page header." />
        <StateBlock type="permission" title="Restricted setting state" message="Admins without System Admin rights see read-only controls." />
      </div>

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
