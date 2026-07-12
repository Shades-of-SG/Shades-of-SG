import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import EmptyState from '../components/EmptyState'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { archiveSong, deleteSong, getCreatorSongs, publishSong, startGeneration, unpublishSong } from '../services/songService'

const filters = [
  ['All', 'ALL'], ['Drafts', 'DRAFT'], ['Generating', 'GENERATING'],
  ['Ready', 'READY'], ['Published', 'PUBLISHED'], ['Archived', 'ARCHIVED'],
]
const statuses = ['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED']
const activeJobStatuses = new Set(['QUEUED', 'PROCESSING'])

function SongArtwork({ song }) {
  return song.coverImageUrl
    ? <img alt={`${song.title} cover`} className="creator-song-cover" src={song.coverImageUrl} />
    : <div aria-label="No cover image" className="creator-song-cover creator-song-cover--fallback">No cover</div>
}

export default function CreatorSongs() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [songs, setSongs] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      const next = await getCreatorSongs(token)
      setSongs(next)
      setSelectedId((current) => next.some((song) => song.id === current) ? current : next[0]?.id || '')
      setError('')
    } catch (nextError) { setError(nextError.message) }
    finally { if (!quiet) setLoading(false) }
  }, [token])

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (!songs.some((song) => song.status === 'GENERATING' || activeJobStatuses.has(song.latestGenerationJob?.status))) return undefined
    const timer = window.setInterval(() => load({ quiet: true }), 3000)
    return () => window.clearInterval(timer)
  }, [load, songs])

  const counts = useMemo(() => Object.fromEntries(statuses.map((status) => [status, songs.filter((song) => song.status === status).length])), [songs])
  const visibleSongs = filter === 'ALL' ? songs : songs.filter((song) => song.status === filter)
  const selected = songs.find((song) => song.id === selectedId) || null

  async function mutate(song, operation, successText) {
    setBusyId(song.id); setError(''); setSuccess('')
    try { await operation(); setSuccess(successText); await load({ quiet: true }) }
    catch (nextError) { setError(nextError.message) }
    finally { setBusyId('') }
  }

  function confirmDelete(song) {
    if (!window.confirm(`Permanently delete “${song.title}”? This cannot be undone.`)) return
    mutate(song, () => deleteSong(song.id, token), 'Song deleted.')
  }

  const latestStatus = selected?.latestGenerationJob?.status
  const canGenerate = selected && ['DRAFT', 'READY'].includes(selected.status) && selected.audioUrl && selected.rawLyrics?.trim() && !activeJobStatuses.has(latestStatus)

  return <CreatorPageShell
    breadcrumbs={['My Songs']} className="creator-page--hero"
    description="Manage your saved drafts, generation progress, ready songs, and public releases."
    title="My Songs"
    actions={<Link className="studio-button studio-button--primary" to="/creator/studio/new">Add Song</Link>}
  >
    <section className="stats-grid">
      {statuses.map((status) => <SectionCard key={status} title={status === 'GENERATING' ? 'Generating' : status[0] + status.slice(1).toLowerCase()}><strong>{counts[status]}</strong><p>{status.toLowerCase()} songs</p></SectionCard>)}
    </section>
    {error && <div className="studio-workflow-message is-error" role="alert">{error}</div>}
    {success && <div className="studio-workflow-message is-success" role="status">{success}</div>}
    <div className="dashboard-filter-bar" aria-label="Song filters">
      {filters.map(([label, value]) => <button className={`dashboard-filter-pill ${filter === value ? 'is-selected' : ''}`} key={value} onClick={() => setFilter(value)} type="button">{label}</button>)}
    </div>
    {loading ? <p role="status">Loading your songs…</p> : null}
    {!loading && visibleSongs.length === 0 ? <EmptyState description="Create or save a Song in Studio to see it here." title="No songs found" /> : null}
    {!loading && visibleSongs.length > 0 ? <div className="creator-song-browser">
      <div className="creator-song-browser__list">
        {visibleSongs.map((song) => <button className={`dashboard-song-item creator-song-row ${song.id === selectedId ? 'is-selected' : ''}`} key={song.id} onClick={() => setSelectedId(song.id)} type="button">
          <SongArtwork song={song} />
          <div className="dashboard-song-copy">
            <h3>{song.title}</h3><p>{song.artist || 'Artist not set'}</p>
            <span className={`dashboard-song-badge is-${song.status.toLowerCase()}`}>{song.status}</span>
            {song.latestGenerationJob ? <small>Generation: {song.latestGenerationJob.status}</small> : null}
            <small>Edited {new Date(song.updatedAt).toLocaleString()}</small>
          </div>
        </button>)}
      </div>
      {selected ? <SectionCard className="creator-song-detail">
        <div className="creator-song-detail__header"><SongArtwork song={selected} /><div className="dashboard-song-copy"><h3>{selected.title}</h3><p>{selected.artist || 'Artist not set'}</p><span className={`dashboard-song-badge is-${selected.status.toLowerCase()}`}>{selected.status}</span></div></div>
        <div className="creator-song-actions">
          {selected.status === 'PUBLISHED' ? <button onClick={() => navigate(`/songs/${selected.id}`)} type="button">View</button> : null}
          <button disabled={selected.status === 'GENERATING'} onClick={() => navigate(`/creator/studio/${selected.id}`)} type="button">Edit</button>
          {canGenerate ? <button disabled={busyId === selected.id} onClick={() => mutate(selected, () => startGeneration(selected.id, token), latestStatus === 'FAILED' ? 'Generation retry queued.' : 'Generation queued.')} type="button">{latestStatus === 'FAILED' ? 'Retry' : 'Generate'}</button> : null}
          {selected.latestGenerationJob ? <button onClick={() => navigate(`/creator/generation/${selected.latestGenerationJob.id}`)} type="button">View Generation</button> : null}
          {selected.status === 'READY' ? <button disabled={!selected.publishReady || busyId === selected.id} onClick={() => mutate(selected, () => publishSong(selected.id, token), 'Song published.')} title={selected.publishReady ? '' : `Missing: ${selected.publishMissing.join(', ')}`} type="button">Publish</button> : null}
          {selected.status === 'PUBLISHED' ? <button disabled={busyId === selected.id} onClick={() => mutate(selected, () => unpublishSong(selected.id, token), 'Song unpublished and returned to Ready.')} type="button">Unpublish</button> : null}
          {!['GENERATING', 'ARCHIVED'].includes(selected.status) ? <button disabled={busyId === selected.id} onClick={() => mutate(selected, () => archiveSong(selected.id, token), 'Song archived.')} type="button">Archive</button> : null}
          {selected.status !== 'GENERATING' ? <button disabled={busyId === selected.id} onClick={() => confirmDelete(selected)} type="button">Delete</button> : null}
        </div>
        <div className="creator-song-detail__lyrics"><h4>Lyrics</h4>{selected.rawLyrics ? <pre>{selected.rawLyrics}</pre> : <p>No lyrics saved.</p>}</div>
      </SectionCard> : null}
    </div> : null}
  </CreatorPageShell>
}
