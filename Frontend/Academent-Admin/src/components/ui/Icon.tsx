interface IconProps {
  name: string
  className?: string
  title?: string
}

const paths: Record<string, string[]> = {
  activity: ['M4 13h4l3-8 4 14 3-6h2'],
  alert: ['M12 9v4', 'M12 17h.01', 'M10.3 4.4 2.2 17.2a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0Z'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9', 'M10 21h4'],
  cards: ['M5 5h10a2 2 0 0 1 2 2v12H7a2 2 0 0 1-2-2V5Z', 'M9 3h10v12'],
  chart: ['M4 19V5', 'M4 19h16', 'M8 15l3-4 3 2 4-6'],
  check: ['M20 6 9 17l-5-5'],
  chevron: ['M9 18l6-6-6-6'],
  dashboard: ['M4 5h7v7H4Z', 'M13 5h7v4h-7Z', 'M13 11h7v8h-7Z', 'M4 14h7v5H4Z'],
  download: ['M12 3v11', 'M8 10l4 4 4-4', 'M4 20h16'],
  error: ['M12 8v5', 'M12 17h.01', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'],
  eye: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  eyeOff: ['M3 3l18 18', 'M10.6 10.6a3 3 0 0 0 4 4', 'M9.9 4.2A10.8 10.8 0 0 1 12 4c6 0 10 8 10 8a18.4 18.4 0 0 1-3 4.1', 'M6.1 6.1A18.5 18.5 0 0 0 2 12s4 8 10 8c1 0 1.9-.1 2.8-.4'],
  file: ['M6 3h8l4 4v14H6Z', 'M14 3v5h5', 'M9 13h6', 'M9 17h6'],
  filter: ['M4 5h16', 'M7 12h10', 'M10 19h4'],
  key: ['M15 7a4 4 0 1 0-2.8 6.8L4 22v-4h4v-4h4l1.2-1.2A4 4 0 0 0 15 7Z'],
  lock: ['M7 11V8a5 5 0 0 1 10 0v3', 'M5 11h14v10H5Z'],
  logs: ['M5 4h14v16H5Z', 'M8 8h8', 'M8 12h8', 'M8 16h5'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  more: ['M12 12h.01', 'M19 12h.01', 'M5 12h.01'],
  plus: ['M12 5v14', 'M5 12h14'],
  quiz: ['M9 9a3 3 0 1 1 4.2 2.8c-.9.5-1.2 1-1.2 2.2', 'M12 18h.01', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'],
  refresh: ['M20 11a8 8 0 0 0-14.8-4L3 9', 'M3 5v4h4', 'M4 13a8 8 0 0 0 14.8 4L21 15', 'M21 19v-4h-4'],
  reports: ['M5 4h14v16H5Z', 'M8 8h8', 'M8 12h5', 'M8 16h8'],
  search: ['M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z', 'M20 20l-4-4'],
  server: ['M4 5h16v6H4Z', 'M4 13h16v6H4Z', 'M8 8h.01', 'M8 16h.01'],
  settings: ['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a7.8 7.8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 1.7 1l.3 3.1h5l.3-3.1a7.8 7.8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z'],
  shield: ['M12 3 5 6v6c0 4.4 2.8 7.6 7 9 4.2-1.4 7-4.6 7-9V6Z', 'M9 12l2 2 4-5'],
  sliders: ['M4 6h10', 'M18 6h2', 'M14 4v4', 'M4 12h2', 'M10 12h10', 'M8 10v4', 'M4 18h12', 'M18 16v4'],
  spark: ['M12 3l1.4 5.2L19 10l-5.6 1.8L12 17l-1.4-5.2L5 10l5.6-1.8Z', 'M19 3v4', 'M21 5h-4'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2', 'M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
}

export function Icon({ name, className, title }: IconProps) {
  const iconPaths = paths[name] ?? paths.dashboard

  return (
    <svg className={className ?? 'icon'} viewBox="0 0 24 24" role={title ? 'img' : 'presentation'} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      {iconPaths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
}
