import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../utils/format'
import { Icon } from './Icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  icon?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({ children, className, icon, size = 'md', variant = 'secondary', ...props }: ButtonProps) {
  return (
    <button className={classNames('button', `button-${variant}`, `button-${size}`, className)} type="button" {...props}>
      {icon ? <Icon name={icon} className="button-icon" /> : null}
      {children ? <span>{children}</span> : null}
    </button>
  )
}
