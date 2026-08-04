import { useCallback, useEffect, useState } from 'react'
import { getAdminSummary } from '../services/adminService'

const summaries = new Map()
const DEDUPE_WINDOW_MS = 1000

function entryFor(token) {
  if (!summaries.has(token)) summaries.set(token, { data: null, promise: null, updatedAt: 0 })
  return summaries.get(token)
}

function requestSummary(token, force = false) {
  const entry = entryFor(token)
  if (entry.promise) return entry.promise
  if (entry.data && !force && Date.now() - entry.updatedAt < DEDUPE_WINDOW_MS) return Promise.resolve(entry.data)

  entry.promise = getAdminSummary(token)
    .then((data) => {
      entry.data = data
      entry.updatedAt = Date.now()
      return data
    })
    .finally(() => { entry.promise = null })

  return entry.promise
}

export function clearAdminSummaryCache() {
  summaries.clear()
}

export default function useAdminSummary(token) {
  const cached = token ? entryFor(token).data : null
  const [state, setState] = useState({ data: cached, error: '', loading: Boolean(token && !cached) })

  const load = useCallback(async (force = false) => {
    if (!token) {
      setState({ data: null, error: '', loading: false })
      return null
    }
    setState((current) => ({ ...current, error: '', loading: !current.data }))
    try {
      const data = await requestSummary(token, force)
      setState({ data, error: '', loading: false })
      return data
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, loading: false }))
      return null
    }
  }, [token])

  useEffect(() => {
    let active = true
    if (!token) {
      setState({ data: null, error: '', loading: false })
      return undefined
    }
    const entry = entryFor(token)
    setState({ data: entry.data, error: '', loading: !entry.data })
    requestSummary(token)
      .then((data) => { if (active) setState({ data, error: '', loading: false }) })
      .catch((error) => { if (active) setState((current) => ({ ...current, error: error.message, loading: false })) })
    return () => { active = false }
  }, [token])

  return { ...state, refresh: () => load(true) }
}
