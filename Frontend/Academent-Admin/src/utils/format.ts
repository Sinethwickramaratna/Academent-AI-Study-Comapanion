export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
