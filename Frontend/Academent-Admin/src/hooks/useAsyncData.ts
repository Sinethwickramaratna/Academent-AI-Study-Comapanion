import { useEffect, useState } from 'react'

export interface AsyncDataState<T> {
  data: T
  error: string
  loading: boolean
  reload: () => void
}

export function useAsyncData<T>(loader: () => Promise<T>, initialData: T, deps: unknown[] = []): AsyncDataState<T> {
  const [data, setData] = useState<T>(initialData)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    loader()
      .then((nextData) => {
        if (!active) return
        setData(nextData)
        setLoading(false)
      })
      .catch((nextError) => {
        if (!active) return
        setError(nextError instanceof Error ? nextError.message : 'Could not load Firebase data.')
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [version, ...deps])

  return {
    data,
    error,
    loading,
    reload: () => setVersion((value) => value + 1),
  }
}