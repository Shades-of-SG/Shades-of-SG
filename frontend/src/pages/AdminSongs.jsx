import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { getAdminSongs } from '../services/adminService'

export default function AdminSongs() {
  const { token } = useAuth()
  const [songs, setSongs] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(() => getAdminSongs(token, { search, status }).then((data) => setSongs(data.songs)).catch((error) => setMessage(error.message)).finally(() => setLoading(false)), [search, status, token])
  useEffect(() => { const timer = window.setTimeout(refresh, 200); return () => window.clearTimeout(timer) }, [refresh])
  return <div className="creator-page"><PageHeader eyebrow="Admin" title="Song oversight" description="Inspect songs across creators without changing creator ownership." />{message ? <p role="alert">{message}</p> : null}<div className="filter-bar"><label>Search<input onChange={(event) => setSearch(event.target.value)} value={search} /></label><label>Status<select onChange={(event) => setStatus(event.target.value)} value={status}><option value="">All statuses</option>{['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED'].map((item) => <option key={item}>{item}</option>)}</select></label></div><SectionCard title="All creator songs">{loading ? <p role="status">Loading songs...</p> : songs.length ? songs.map((song) => <article className="dashboard-song-item" key={song.id}><div className="dashboard-song-copy"><strong>{song.title}</strong><span>{song.creator?.name} ({song.creator?.email})</span><small>{song.status} - {(song.folders || []).map((folder) => folder.name).join(', ') || 'No collections'}</small></div></article>) : <p>No songs found.</p>}</SectionCard></div>
}
