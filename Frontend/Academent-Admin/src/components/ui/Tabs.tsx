import { classNames } from '../../utils/format'

interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          className={classNames('tab', active === tab && 'active')}
          key={tab}
          role="tab"
          aria-selected={active === tab}
          type="button"
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
