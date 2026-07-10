import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import ModerationConfirmDialog from '../components/creator/reflections/ModerationConfirmDialog'
import ModerationEmptyState from '../components/creator/reflections/ModerationEmptyState'
import ModerationFilters from '../components/creator/reflections/ModerationFilters'
import ModerationGrid from '../components/creator/reflections/ModerationGrid'
import ModerationStats from '../components/creator/reflections/ModerationStats'
import ModerationTabs from '../components/creator/reflections/ModerationTabs'
import ReflectionDetailsPanel from '../components/creator/reflections/ReflectionDetailsPanel'
import { useAuth } from '../context/AuthContext'
import {
  deleteReflection,
  getModerationReflections,
  getReflectionSongs,
  moderateReflection,
} from '../services/reflectionService'
import './ReflectionModeration.css'

const EMPTY_STATS = {
  approved: 0,
  flagged: 0,
  newToday: 0,
  newYesterday: 0,
  pending: 0,
}

const EMPTY_PAGINATION = { limit: 8, page: 1, total: 0, totalPages: 1 }

function HeartIcon() {
  return (
    <svg aria-hidden="true" className="crm-title-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}

export default function ReflectionModeration() {
  const navigate = useNavigate()
  const { signOut, token } = useAuth()
  const [activeStatus, setActiveStatus] = useState('PENDING')
  const [filters, setFilters] = useState({ anonymousOnly: false, dateFrom: '', search: '', songId: '' })
  const [reflections, setReflections] = useState([])
  const [songs, setSongs] = useState([])
  const [stats, setStats] = useState(EMPTY_STATS)
  const [pagination, setPagination] = useState(EMPTY_PAGINATION)
  const [selectedId, setSelectedId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const requestId = useRef(0)

  const hasActiveFilters = Boolean(filters.search.trim() || filters.songId || filters.dateFrom || filters.anonymousOnly)
  const selectedReflection = useMemo(
    () => reflections.find((reflection) => reflection.id === selectedId) || null,
    [reflections, selectedId],
  )

  useEffect(() => {
    let active = true
    getReflectionSongs()
      .then((nextSongs) => { if (active) setSongs(nextSongs) })
      .catch(() => { if (active) setSongs([]) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const currentRequest = requestId.current + 1
    requestId.current = currentRequest
    let active = true
    const delay = filters.search.trim() ? 250 : 0
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError('')
      getModerationReflections({ ...filters, limit: 8, page: 1, status: activeStatus }, token)
        .then((data) => {
          if (!active || currentRequest !== requestId.current) return
          const nextReflections = data.reflections || []
          setReflections(nextReflections)
          setStats({ ...EMPTY_STATS, ...data.stats })
          setPagination({ ...EMPTY_PAGINATION, ...data.pagination })
          setSelectedId((current) => nextReflections.some((item) => item.id === current) ? current : (nextReflections[0]?.id || null))
        })
        .catch((nextError) => {
          if (!active || currentRequest !== requestId.current) return
          if (nextError.status === 401 || nextError.status === 403) {
            signOut()
            navigate('/login', { replace: true })
            return
          }
          setError(nextError.message)
          setReflections([])
          setSelectedId(null)
        })
        .finally(() => {
          if (active && currentRequest === requestId.current) setIsLoading(false)
        })
    }, delay)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [activeStatus, filters, navigate, retryKey, signOut, token])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  function changeStatus(status) {
    setActiveStatus(status)
    setSelectedId(null)
  }

  function changeFilter(name, value) {
    if (typeof name === 'object') {
      setFilters((current) => ({ ...current, ...name }))
      return
    }
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function clearFilters() {
    setFilters({ anonymousOnly: false, dateFrom: '', search: '', songId: '' })
  }

  function moveOutOfCurrentTab(id, nextStatus, updatedReflection) {
    const previous = reflections.find((item) => item.id === id)
    if (!previous) return

    if (nextStatus === activeStatus) {
      setReflections((current) => current.map((item) => item.id === id ? updatedReflection : item))
      return
    }

    const remaining = reflections.filter((item) => item.id !== id)
    setReflections(remaining)
    setSelectedId((current) => current === id ? (remaining[0]?.id || null) : current)
    setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }))
    setStats((current) => ({
      ...current,
      [previous.status.toLowerCase()]: Math.max(0, current[previous.status.toLowerCase()] - 1),
      [nextStatus.toLowerCase()]: current[nextStatus.toLowerCase()] + 1,
    }))
  }

  async function runAction(reflection, action) {
    if (action === 'delete') {
      setDeleteTarget(reflection)
      return
    }

    const nextStatus = action === 'approve' ? 'APPROVED' : 'FLAGGED'
    setBusyId(reflection.id)
    try {
      const updated = await moderateReflection(reflection.id, {
        moderatorNote: reflection.moderatorNote || '',
        status: nextStatus,
      }, token)
      moveOutOfCurrentTab(reflection.id, nextStatus, updated)
      setToast({ message: nextStatus === 'APPROVED' ? 'Reflection approved and published.' : 'Reflection flagged for review.', type: 'success' })
    } catch (nextError) {
      setToast({ message: nextError.message, type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  async function saveModeratorNote(reflection, moderatorNote) {
    setBusyId(reflection.id)
    try {
      const updated = await moderateReflection(reflection.id, { moderatorNote, status: reflection.status }, token)
      setReflections((current) => current.map((item) => item.id === updated.id ? updated : item))
      setToast({ message: 'Moderator note saved.', type: 'success' })
    } catch (nextError) {
      setToast({ message: nextError.message, type: 'error' })
      throw nextError
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setBusyId(target.id)
    try {
      await deleteReflection(target.id, token)
      const remaining = reflections.filter((item) => item.id !== target.id)
      setReflections(remaining)
      setSelectedId((current) => current === target.id ? (remaining[0]?.id || null) : current)
      setStats((current) => ({ ...current, [target.status.toLowerCase()]: Math.max(0, current[target.status.toLowerCase()] - 1) }))
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }))
      setDeleteTarget(null)
      setToast({ message: 'Reflection permanently deleted.', type: 'success' })
    } catch (nextError) {
      setToast({ message: nextError.message, type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  async function loadMore() {
    const nextPage = pagination.page + 1
    setIsLoadingMore(true)
    try {
      const data = await getModerationReflections({ ...filters, limit: pagination.limit, page: nextPage, status: activeStatus }, token)
      setReflections((current) => [...current, ...(data.reflections || [])])
      setStats({ ...EMPTY_STATS, ...data.stats })
      setPagination({ ...EMPTY_PAGINATION, ...data.pagination })
    } catch (nextError) {
      setToast({ message: nextError.message, type: 'error' })
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <CreatorPageShell
      breadcrumbs={['Reflections']}
      className="creator-reflection-moderation"
      description="Curate and manage memories shared by the community."
      title={<span className="crm-title"><HeartIcon />Reflection Moderation</span>}
    >
      <ModerationStats stats={stats} />

      <section className="crm-workspace" aria-label="Reflection moderation workspace">
        <div className="crm-workspace__main">
          <ModerationTabs activeStatus={activeStatus} counts={stats} onChange={changeStatus} />
          <ModerationFilters filters={filters} hasActiveFilters={hasActiveFilters} onChange={changeFilter} onClear={clearFilters} songs={songs} />

          {error ? (
            <div className="crm-error-state" role="alert">
              <strong>We couldn&apos;t load reflections.</strong>
              <p>{error}</p>
              <button onClick={() => setRetryKey((current) => current + 1)} type="button">Retry</button>
            </div>
          ) : null}

          {!error && isLoading ? (
            <div aria-label="Loading reflections" className="crm-skeleton-grid" role="status">
              {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
            </div>
          ) : null}

          {!error && !isLoading && reflections.length === 0 ? (
            <ModerationEmptyState filtered={hasActiveFilters} onClear={clearFilters} status={activeStatus} />
          ) : null}

          {!error && !isLoading && reflections.length > 0 ? (
            <>
              <ModerationGrid busyId={busyId} onAction={runAction} onSelect={setSelectedId} reflections={reflections} selectedId={selectedId} />
              {pagination.page < pagination.totalPages ? (
                <div className="crm-load-more">
                  <button disabled={isLoadingMore} onClick={loadMore} type="button">{isLoadingMore ? 'Loading…' : 'Load more reflections'}</button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <ReflectionDetailsPanel
          busy={busyId === selectedReflection?.id}
          isOpen={Boolean(selectedReflection)}
          onAction={runAction}
          onClose={() => setSelectedId(null)}
          onSaveNote={saveModeratorNote}
          reflection={selectedReflection}
        />
      </section>

      {deleteTarget ? (
        <ModerationConfirmDialog
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          reflection={deleteTarget}
        />
      ) : null}

      {toast ? <div className={`crm-toast is-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>{toast.message}</div> : null}
    </CreatorPageShell>
  )
}
