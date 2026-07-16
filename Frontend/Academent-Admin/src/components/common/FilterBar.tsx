import type { ReactNode } from 'react'
import { Icon } from '../ui/Icon'

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="filter-bar">
      <Icon name="filter" />
      {children}
    </div>
  )
}
