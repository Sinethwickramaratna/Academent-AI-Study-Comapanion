import { useEffect, useState } from 'react'

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 860px)').matches)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 860px)')
    const update = () => setIsMobile(query.matches)

    query.addEventListener('change', update)
    update()

    return () => query.removeEventListener('change', update)
  }, [])

  return { isMobile }
}
