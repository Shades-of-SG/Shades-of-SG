import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, ArchiveRestore, Pencil, Trash2, Video } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import EmptyState from '../components/EmptyState'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { archiveSong, deleteSong, getCreatorSongs, startGeneration, unarchiveSong } from '../services/songService'

const filters = [
  ['All', 'ALL'], ['Drafts', 'DRAFT'], ['Generating', 'GENERATING'],
  ['Ready', 'READY'], ['Published', 'PUBLISHED'], ['Archived', 'ARCHIVED'],
]
const statuses = ['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED']
const activeJobStatuses = new Set(['QUEUED', 'PROCESSING'])
const emptyStates = {
  ALL: { title: 'Your song library is ready', description: 'Create your first song in Studio to start building a music video.' },
  DRAFT: { title: 'No drafts yet', description: 'Drafts are songs you have saved but have not started generating yet. Create or save one in Studio.' },
  GENERATING: { title: 'No videos are generating', description: 'Songs appear here while their video is being created. Start generation from a saved draft when you are ready.' },
  READY: { title: 'Nothing is ready to publish yet', description: 'Completed videos that are ready for your final review and publishing will appear here.' },
  PUBLISHED: { title: 'No published songs yet', description: 'Songs you publish to the Studio will appear here for you to manage and share.' },
  ARCHIVED: { title: 'No archived songs', description: 'Archived songs are kept here when you want to hide them from your active library without deleting them.' },
}

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

  useEffect(() => {
    if (!error && !success) return undefined
    const timer = window.setTimeout(() => {
      setError('')
      setSuccess('')
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [error, success])

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

  function toggleArchive(song) {
    if (song.status === 'ARCHIVED') {
      mutate(song, () => unarchiveSong(song.id, token), 'Song restored.')
      return
    }
    mutate(song, () => archiveSong(song.id, token), 'Song archived.')
  }

  const latestStatus = selected?.latestGenerationJob?.status
  const hasActiveGeneration = selected && activeJobStatuses.has(latestStatus)
  const canGenerate = selected && ['DRAFT', 'READY'].includes(selected.status) && selected.audioUrl && selected.rawLyrics?.trim() && !activeJobStatuses.has(latestStatus)

  function handleGenerationAction() {
    if (hasActiveGeneration && selected.latestGenerationJob?.id) {
      navigate(`/creator/generation/${selected.latestGenerationJob.id}`)
      return
    }
    mutate(selected, () => startGeneration(selected.id, token), latestStatus === 'FAILED' ? 'Generation retry queued.' : 'Generation queued.')
  }

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
    {!loading && visibleSongs.length === 0 ? <EmptyState {...emptyStates[filter]} /> : null}
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
          <div className="creator-song-actions__icons">
            <button aria-label="Edit song" className="creator-song-icon-button" disabled={busyId === selected.id} onClick={() => navigate(`/creator/studio/${selected.id}`)} title="Edit song" type="button"><Pencil aria-hidden="true" /></button>
            <button aria-label={selected.status === 'ARCHIVED' ? 'Unarchive song' : 'Archive song'} className="creator-song-icon-button" disabled={busyId === selected.id || selected.status === 'GENERATING'} onClick={() => toggleArchive(selected)} title={selected.status === 'ARCHIVED' ? 'Unarchive song' : 'Archive song'} type="button">{selected.status === 'ARCHIVED' ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}</button>
            <button aria-label="Delete song" className="creator-song-icon-button is-danger" disabled={busyId === selected.id || selected.status === 'GENERATING'} onClick={() => confirmDelete(selected)} title="Delete song" type="button"><Trash2 aria-hidden="true" /></button>
          </div>
          <button className="creator-song-generate-button" disabled={busyId === selected.id || (!hasActiveGeneration && !canGenerate)} onClick={handleGenerationAction} title={!hasActiveGeneration && !canGenerate ? 'Add saved audio and lyrics to generate a video.' : ''} type="button"><Video aria-hidden="true" />{hasActiveGeneration ? 'View Generation' : latestStatus === 'FAILED' ? 'Retry Video' : 'Generate Video'}</button>
        </div>
        <div className="creator-song-detail__lyrics"><h4>Lyrics</h4>{selected.rawLyrics ? <pre>{selected.rawLyrics}</pre> : <p>No lyrics saved.</p>}</div>
      </SectionCard> : null}
    </div> : null}
  </CreatorPageShell>
}
