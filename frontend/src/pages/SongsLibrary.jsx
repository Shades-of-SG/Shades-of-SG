import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState'
import FilterBar from '../components/FilterBar'
import PageHeader from '../components/PageHeader'
import SongCard from '../components/SongCard'
import { getPublishedSongs } from '../services/publicSongService'

export default function SongsLibrary() {
  const [songs, setSongs] = useState([])
  const [filters, setFilters] = useState({ search: '', theme: '', language: '', mood: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      getPublishedSongs(filters).then((data) => { if (active) { setSongs(data); setError('') } })
        .catch((nextError) => active && setError(nextError.message))
        .finally(() => active && setLoading(false))
    }, filters.search ? 250 : 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [filters])

  const options = useMemo(() => ({
    languageOptions: [...new Set(songs.flatMap((song) => song.languages || []))].sort(),
    moodOptions: [...new Set(songs.flatMap((song) => song.moodTags || []))].sort(),
    themeOptions: [...new Set(songs.map((song) => song.theme).filter(Boolean))].sort(),
  }), [songs])

  return <div className="page-stack">
    <PageHeader description="Search published songs that power learning, trivia, playground, and rhythm experiences." eyebrow="Songs Library" title="Songs Library" />
    <FilterBar filters={{ ...filters, ...options }} onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))} />
    {error && <div className="state-box" role="alert">{error}</div>}
    {loading ? <p role="status">Loading published songs…</p> : null}
    {!loading && !error && songs.length === 0 ? <EmptyState description="No published songs match these filters." title="No songs found" /> : null}
    {!loading && songs.length > 0 ? <section className="responsive-grid" aria-label="Song grid">{songs.map((song) => <SongCard key={song.id} song={song} />)}</section> : null}
  </div>
}
