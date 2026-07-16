import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { getCreatorDashboardSummary } from '../services/songService'

const songFilters = [
  ['All', 'ALL'],
  ['Published', 'PUBLISHED'],
  ['Drafts', 'DRAFT'],
  ['Generating', 'GENERATING'],
  ['Ready', 'READY'],
  ['Archived', 'ARCHIVED'],
]

const statusLabels = {
  ARCHIVED: 'Archived',
  DRAFT: 'Draft',
  GENERATING: 'Generating',
  PUBLISHED: 'Published',
  READY: 'Ready to publish',
}

function getInitials(title = '') {
  const initials = title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return initials || 'SG'
}

function getSongBadgeClass(status) {
  if (status === 'GENERATING') return 'processing'
  if (status === 'READY') return 'published'
  return String(status || 'DRAFT').toLowerCase()
}

function formatJobStatus(status) {
  return String(status || 'NOT_STARTED')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

export default function Dashboard() {
  const { token } = useAuth()
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(() => {
    setLoading(true)
    setError('')

    return getCreatorDashboardSummary(token)
      .then((data) => setSummary(data))
      .catch((nextError) => {
        setSummary(null)
        setError(nextError.message || 'Unable to load the creator dashboard.')
      })
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    const timer = window.setTimeout(loadDashboard, 0)
    return () => window.clearTimeout(timer)
  }, [loadDashboard])

  const counts = summary?.counts || {}
  const recentSongs = useMemo(() => summary?.recentSongs || [], [summary])
  const generationJobs = useMemo(() => summary?.generationJobs || [], [summary])
  const filteredSongs = activeFilter === 'ALL'
    ? recentSongs
    : recentSongs.filter((song) => song.status === activeFilter)
  const metricValue = (value) => loading || error ? '—' : value ?? 0

  return (
    <CreatorPageShell
      breadcrumbs={['Dashboard']}
      className="creator-page--hero"
      description="Live creator overview for song health, generation work, and publishing actions."
      title="Dashboard"
      actions={
        <>
          <Link className="studio-button studio-button--secondary" to="/creator/songs">Open Songs</Link>
          <Link className="studio-button studio-button--primary" to="/creator/reflections">Review Queue</Link>
        </>
      }
    >
      {error ? (
        <div className="state-box" role="alert">
          <strong>Dashboard data could not be loaded</strong>
          <p>{error}</p>
          <button className="studio-button studio-button--secondary" onClick={loadDashboard} type="button">Try again</button>
        </div>
      ) : null}

      <section className="stats-grid">
        <SectionCard title="Total Songs"><strong>{metricValue(counts.total)}</strong><span>songs</span><p>All tracks in your studio</p><Link className="inline-link" to="/creator/songs">Open songs <span aria-hidden="true">→</span></Link></SectionCard>
        <SectionCard title="Published"><strong>{metricValue(counts.PUBLISHED)}</strong><span>live</span><p>Available in the public library</p><Link className="inline-link" to="/creator/songs">See published <span aria-hidden="true">→</span></Link></SectionCard>
        <SectionCard title="Generating"><strong>{metricValue(counts.GENERATING)}</strong><span>songs</span><p>AI generation currently in progress</p><Link className="inline-link" to="/creator/generation">View generation <span aria-hidden="true">→</span></Link></SectionCard>
        <SectionCard title="Play analytics"><strong>Unavailable</strong><p>Complete song-play events are not tracked yet.</p><Link className="inline-link" to="/creator/plays">Why unavailable <span aria-hidden="true">→</span></Link></SectionCard>
        <SectionCard title="Archived"><strong>{metricValue(counts.ARCHIVED)}</strong><span>songs</span><p>Removed from active rotation</p><Link className="inline-link" to="/creator/songs">View archived <span aria-hidden="true">→</span></Link></SectionCard>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-grid__main">
          <SectionCard title="Recent Songs">
            <div className="dashboard-filter-bar" aria-label="Song filters">
              {songFilters.map(([label, value]) => (
                <button
                  key={value}
                  className={`dashboard-filter-pill ${value === activeFilter ? 'is-selected' : ''}`}
                  onClick={() => setActiveFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {loading ? <p role="status">Loading recent songs…</p> : null}
            {!loading && !error && filteredSongs.length === 0 ? (
              <EmptyState
                description={activeFilter === 'ALL' ? 'Create a song in Studio to see it here.' : 'No recent songs match this status.'}
                title="No songs found"
              />
            ) : null}
            {!loading && !error && filteredSongs.length > 0 ? (
              <div className="dashboard-song-list">
                {filteredSongs.map((song) => (
                  <article key={song.id} className="dashboard-song-item">
                    <div className="dashboard-song-art" aria-hidden="true">
                      {getInitials(song.title)}
                    </div>
                    <div className="dashboard-song-copy">
                      <h3>{song.title || 'Untitled song'}</h3>
                      <p>{song.artist || 'Artist not set'}</p>
                      <span className={`dashboard-song-badge is-${getSongBadgeClass(song.status)}`}>
                        {statusLabels[song.status] || formatJobStatus(song.status)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </SectionCard>
        </div>

        <div className="dashboard-grid__aside">
          <SectionCard title="Recent Generation Jobs">
            {loading ? <p role="status">Loading generation jobs…</p> : null}
            {!loading && !error && generationJobs.length === 0 ? (
              <EmptyState description="Generation jobs will appear here when you start one." title="No generation jobs yet" />
            ) : null}
            {!loading && !error && generationJobs.length > 0 ? (
              <div className="dashboard-job-list">
                {generationJobs.map((job) => (
                  <article key={job.id} className="dashboard-job-item">
                    <strong>{job.song?.title || 'Untitled song'}</strong>
                    <span>{formatJobStatus(job.status)}</span>
                  </article>
                ))}
              </div>
            ) : null}
          </SectionCard>
        </div>
      </section>
    </CreatorPageShell>
  )
}
