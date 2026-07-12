import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { getPublishedSongs } from '../services/publicSongService'
import { getBeatmapSummary } from '../services/beatmapService'

export default function RhythmHub() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPublishedSongs()
      .then(async (data) => Promise.all(data.filter((song) => song.audioUrl && Number(song.durationSecs) >= 5).map(async (song) => {
        const beatmaps = await getBeatmapSummary(song.id).catch(() => [])
        const difficulties = beatmaps.filter((row) => row.status === 'PUBLISHED').map((row) => row.difficulty)
        return difficulties.length ? { ...song, rhythmDifficulties: difficulties } : null
      })))
      .then((data) => active && setSongs(data.filter(Boolean)))
      .catch((nextError) => active && setError(nextError.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return <div className="page-stack">
    <PageHeader description="Choose a song with a published rhythm game." eyebrow="Rhythm Game" title="Rhythm Game" />
    {loading ? <p role="status">Loading published rhythm games…</p> : null}
    {error ? <div className="state-box" role="alert">{error}</div> : null}
    {!loading && !error && songs.length === 0 ? <EmptyState description="No songs currently have a published rhythm game." title="No rhythm games yet" /> : null}
    <section className="responsive-grid">{songs.map((song) => <SectionCard key={song.id} title={song.title}>
      {song.coverImageUrl ? <img alt={`${song.title} cover`} className="song-art song-art--image" src={song.coverImageUrl} /> : <div className="song-art song-art--fallback">No cover</div>}
      <p>{song.artist || 'Artist unavailable'}</p>
      <p>{song.theme || 'Theme unavailable'} · {(song.languages || []).join(', ') || 'Language unavailable'}</p>
      <Link className="primary-link" to={`/game/${song.id}?difficulty=${song.rhythmDifficulties[0]}`}>Play Song</Link>
    </SectionCard>)}</section>
  </div>
}
