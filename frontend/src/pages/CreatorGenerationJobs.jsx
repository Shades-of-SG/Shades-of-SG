import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import EmptyState from '../components/EmptyState'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { getCreatorSongs, getGenerationJobs, startGeneration } from '../services/songService'

const filters = ['ALL', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']
const activeStatuses = new Set(['QUEUED', 'PROCESSING'])

export default function CreatorGenerationJobs() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [jobs, setJobs] = useState([])
  const [songs, setSongs] = useState([])
  const [selectedSongId, setSelectedSongId] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      const [nextJobs, ownedSongs] = await Promise.all([
        getGenerationJobs(token), getCreatorSongs(token),
      ])
      setJobs(nextJobs)
      setSongs(ownedSongs.filter((song) => ['DRAFT', 'READY'].includes(song.status) && song.audioUrl && song.rawLyrics?.trim()))
      setError('')
    } catch (nextError) { setError(nextError.message) }
    finally { if (!quiet) setLoading(false) }
  }, [token])

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (!jobs.some((job) => activeStatuses.has(job.status))) return undefined
    const timer = window.setInterval(() => load({ quiet: true }), 3000)
    return () => window.clearInterval(timer)
  }, [jobs, load])

  useEffect(() => {
    if (!error && !success) return undefined
    const timer = window.setTimeout(() => {
      setError('')
      setSuccess('')
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [error, success])

  const filteredJobs = filter === 'ALL' ? jobs : jobs.filter((job) => job.status === filter)
  const activeCount = jobs.filter((job) => activeStatuses.has(job.status)).length
  const completeCount = jobs.filter((job) => job.status === 'COMPLETED').length
  const selectedSong = songs.find((song) => song.id === selectedSongId)
  const hasActiveJob = selectedSong && jobs.some((job) => job.songId === selectedSong.id && activeStatuses.has(job.status))

  async function handleStart() {
    if (!selectedSongId) return setError('Choose an existing Studio draft first.')
    setStarting(true); setError(''); setSuccess('')
    try {
      const job = await startGeneration(selectedSongId, token)
      setSuccess(`Generation queued for ${selectedSong?.title || 'the selected song'}.`)
      setSelectedSongId('')
      await load({ quiet: true })
      navigate(`/creator/generation/${job.id}`)
    } catch (nextError) { setError(nextError.message) }
    finally { setStarting(false) }
  }

  return <CreatorPageShell
    breadcrumbs={['Generation Tasks']}
    description="Start and monitor AI video generation for songs already saved in Studio."
    title="Generation Tasks"
    actions={<Link className="studio-button studio-button--primary" to="/creator/studio/new">Create in Studio</Link>}
  >
    <SectionCard title="Start generation for an existing song">
      <p>Song metadata, audio, and lyrics are managed in Studio. This page never creates a Song.</p>
      <div className="studio-form-grid" style={{ alignItems: 'end', marginTop: '1rem' }}>
        <label className="studio-field">
          <span>Eligible Studio Song</span>
          <select onChange={(event) => setSelectedSongId(event.target.value)} value={selectedSongId}>
            <option value="">Select a DRAFT or READY song</option>
            {songs.map((song) => <option key={song.id} value={song.id}>{song.title} — {song.status}</option>)}
          </select>
        </label>
        <button className="studio-button studio-button--primary" disabled={starting || !selectedSongId || hasActiveJob} onClick={handleStart} type="button">
          {starting ? 'Queuing…' : hasActiveJob ? 'Generation already active' : 'Generate Video'}
        </button>
      </div>
      {songs.length === 0 && !loading ? <p>No eligible songs. Save audio and lyrics to a DRAFT or READY song in Studio first.</p> : null}
    </SectionCard>

    {error && <div className="studio-workflow-message is-error" role="alert">{error}</div>}
    {success && <div className="studio-workflow-message is-success" role="status">{success}</div>}

    <section className="stats-grid stats-grid--two-col">
      <SectionCard title="Active Jobs"><strong>{loading ? '-' : activeCount}</strong><p>Queued or processing.</p></SectionCard>
      <SectionCard title="Completed"><strong>{loading ? '-' : completeCount}</strong><p>Finished and ready for creator review.</p></SectionCard>
    </section>

    <div className="dashboard-filter-bar" aria-label="Job filters">
      {filters.map((value) => <button className={`dashboard-filter-pill ${value === filter ? 'is-selected' : ''}`} key={value} onClick={() => setFilter(value)} type="button">{value === 'ALL' ? 'All' : value}</button>)}
    </div>

    {loading ? <p role="status">Loading generation tasks…</p> : null}
    {!loading && filteredJobs.length === 0 ? <EmptyState description="Start generation from a saved Studio draft." title="No generation jobs found" /> : null}
    {!loading && filteredJobs.length > 0 ? <div className="creator-song-browser__list">
      {filteredJobs.map((job) => <article className="dashboard-song-item creator-song-row" key={job.id}>
        <div className="dashboard-song-copy">
          <h3>{job.song?.title || 'Untitled song'}</h3>
          <p>{job.song?.artist || 'Artist not set'}</p>
          <span className={`dashboard-song-badge is-${job.status.toLowerCase()}`}>{job.status}</span>
          {job.status === 'FAILED' && job.errorMessage ? <p className="studio-workflow-message is-error">{job.errorMessage}</p> : null}
        </div>
        <button className="studio-button studio-button--secondary" onClick={() => navigate(`/creator/generation/${job.id}`)} type="button">View Status</button>
      </article>)}
    </div> : null}
  </CreatorPageShell>
}
