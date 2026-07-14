import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import EmptyState from '../components/EmptyState'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { getCreatorDashboardSummary } from '../services/songService'

const activeStatuses = new Set(['QUEUED', 'PROCESSING'])
const countCards = [
  ['Total Songs', 'total'], ['Drafts', 'DRAFT'], ['Generating', 'GENERATING'],
  ['Ready', 'READY'], ['Published', 'PUBLISHED'], ['Archived', 'ARCHIVED'],
]

function Artwork({ song }) {
  return song.coverImageUrl
    ? <img alt={`${song.title} cover`} className="creator-song-cover" src={song.coverImageUrl} />
    : <div aria-label="No cover image" className="creator-song-cover creator-song-cover--fallback">No cover</div>
}

export default function Dashboard() {
  const { token } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try { setSummary(await getCreatorDashboardSummary(token)); setError('') }
    catch (nextError) { setError(nextError.message) }
    finally { if (!quiet) setLoading(false) }
  }, [token])

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (!summary?.generationJobs?.some((job) => activeStatuses.has(job.status))) return undefined
    const timer = window.setInterval(() => load({ quiet: true }), 3000)
    return () => window.clearInterval(timer)
  }, [load, summary])

  return <CreatorPageShell
    breadcrumbs={['Dashboard']} className="creator-page--hero"
    description="A live creator overview sourced from your songs and generation jobs."
    title="Dashboard"
    actions={<><Link className="studio-button studio-button--secondary" to="/creator/songs">Open Songs</Link><Link className="studio-button studio-button--primary" to="/creator/generation">Review Queue</Link></>}
  >
    {error && <div className="studio-workflow-message is-error" role="alert">{error}<button onClick={() => load()} type="button">Retry</button></div>}
    {loading ? <p role="status">Loading creator dashboard…</p> : null}
    {!loading && summary ? <>
      <section className="stats-grid">
        {countCards.map(([label, key]) => <SectionCard key={key} title={label}><strong>{summary.counts[key] || 0}</strong><span>songs</span></SectionCard>)}
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-grid__main">
          <SectionCard title="Recently edited songs">
            {summary.recentSongs.length === 0 ? <EmptyState description="Save a draft in Studio to begin." title="No songs yet" /> : <div className="dashboard-song-list">
              {summary.recentSongs.map((song) => <article className="dashboard-song-item" key={song.id}>
                <Artwork song={song} />
                <div className="dashboard-song-copy"><h3>{song.title}</h3><p>{song.artist || 'Artist not set'}</p><span className={`dashboard-song-badge is-${song.status.toLowerCase()}`}>{song.status}</span><small>Edited {new Date(song.updatedAt).toLocaleString()}</small><Link className="inline-link" to={`/creator/studio/${song.id}`}>Open in Studio</Link></div>
              </article>)}
            </div>}
          </SectionCard>
        </div>
        <div className="dashboard-grid__aside">
          <SectionCard title="Generation jobs">
            {summary.generationJobs.length === 0 ? <EmptyState description="Generation attempts will appear here." title="No generation jobs" /> : <div className="dashboard-job-list">
              {summary.generationJobs.map((job) => <article className="dashboard-job-item" key={job.id}><strong>{job.song?.title || 'Untitled song'}</strong><span>{job.status}</span>{job.errorMessage ? <small>{job.errorMessage}</small> : null}<Link className="inline-link" to={`/creator/generation/${job.id}`}>View status</Link></article>)}
            </div>}
          </SectionCard>
          <SectionCard title="Play analytics"><strong>Unavailable</strong><p>Reliable play tracking has not been implemented, so no estimated totals or weekly chart are shown.</p></SectionCard>
        </div>
      </section>
    </> : null}
  </CreatorPageShell>
}
