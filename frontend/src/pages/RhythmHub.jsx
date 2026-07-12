import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { getPublishedSongs } from '../services/publicSongService'

export default function RhythmHub() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getPublishedSongs().then((data) => active && setSongs(data.filter((song) => song.audioUrl && Number(song.durationSecs) >= 5))).catch((nextError) => active && setError(nextError.message)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])
  return <div className="page-stack"><PageHeader description="Choose a published Song with uploaded audio for rhythm play." eyebrow="Rhythm Game" title="Rhythm Game" />{loading ? <p role="status">Loading published songs…</p> : null}{error ? <div className="state-box" role="alert">{error}</div> : null}{!loading && !error && songs.length === 0 ? <EmptyState description="No published Songs currently have playable audio and duration data." title="No playable songs" /> : null}<section className="responsive-grid">{songs.map((song) => <SectionCard key={song.id} title={song.title}>{song.coverImageUrl ? <img alt={`${song.title} cover`} className="song-art song-art--image" src={song.coverImageUrl} /> : <div className="song-art song-art--fallback">No cover</div>}<p>{song.artist || 'Artist unavailable'}</p><p>{song.theme || 'Theme unavailable'} · {(song.languages || []).join(', ') || 'Language unavailable'}</p><Link className="primary-link" to={`/game/${song.id}`}>Play Song</Link></SectionCard>)}</section></div>
}
