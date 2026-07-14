import { useEffect, useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { getPublishedSongs } from '../services/publicSongService'
import { getBeatmapSummary } from '../services/beatmapService'

const DIFFICULTY_ORDER = ['EASY', 'MEDIUM', 'HARD']

function difficultyLabel(difficulty) {
  return difficulty[0] + difficulty.slice(1).toLowerCase()
}

function formatDuration(durationSecs) {
  const totalSeconds = Math.floor(Number(durationSecs))
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return ''
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function sortSongs(songs, sortBy) {
  return [...songs].sort((left, right) => {
    if (sortBy === 'title') return String(left.title || '').localeCompare(String(right.title || ''))
    if (sortBy === 'artist') {
      return String(left.artist || '').localeCompare(String(right.artist || ''))
        || String(left.title || '').localeCompare(String(right.title || ''))
    }
    const leftDate = Date.parse(left.publishedDate) || 0
    const rightDate = Date.parse(right.publishedDate) || 0
    return rightDate - leftDate
  })
}

function groupPublishedBeatmapsBySong(entries) {
  const songsById = new Map()

  entries.forEach(({ beatmaps, song }) => {
    beatmaps
      .filter((beatmap) => beatmap.status === 'PUBLISHED')
      .forEach((beatmap) => {
        const groupedSong = songsById.get(song.id) || { ...song, difficulties: [] }
        if (!groupedSong.difficulties.some((item) => item.difficulty === beatmap.difficulty)) {
          groupedSong.difficulties.push(beatmap)
        }
        songsById.set(song.id, groupedSong)
      })
  })

  return [...songsById.values()].map((song) => ({
    ...song,
    difficulties: song.difficulties.sort(
      (left, right) => DIFFICULTY_ORDER.indexOf(left.difficulty) - DIFFICULTY_ORDER.indexOf(right.difficulty),
    ),
  }))
}

export default function RhythmHub() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const sortedSongs = useMemo(() => sortSongs(songs, sortBy), [songs, sortBy])

  useEffect(() => {
    let active = true
    getPublishedSongs()
      .then(async (data) => Promise.all(
        data
          .filter((song) => song.audioUrl && Number(song.durationSecs) >= 5)
          .map(async (song) => ({ beatmaps: await getBeatmapSummary(song.id).catch(() => []), song })),
      ))
      .then((entries) => active && setSongs(groupPublishedBeatmapsBySong(entries)))
      .catch((nextError) => active && setError(nextError.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return <div className="page-stack rhythm-hub">
    <PageHeader description="Choose a published song and play any available difficulty." eyebrow="Rhythm Game" title="Rhythm Game" />
    {loading ? <p role="status">Loading published rhythm games…</p> : null}
    {error ? <div className="state-box" role="alert">{error}</div> : null}
    {!loading && !error && songs.length === 0 ? <EmptyState description="No fully published songs currently have a published rhythm track." title="No rhythm games yet" /> : null}
    {songs.length > 0 ? <>
      <div className="rhythm-list-toolbar">
        <label htmlFor="rhythm-sort">Sort by</label>
        <select id="rhythm-sort" onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
          <option value="newest">Newest</option>
          <option value="title">Title</option>
          <option value="artist">Artist</option>
        </select>
      </div>
      <section aria-label="Published rhythm games" className="rhythm-song-list">
      {sortedSongs.map((song) => {
        const titleId = `rhythm-song-${song.id}`
        const duration = formatDuration(song.durationSecs)
        const metadata = [song.theme, (song.languages || []).join(', '), duration].filter(Boolean)
        return <article aria-labelledby={titleId} className="rhythm-song-row" key={song.id}>
          <div className="rhythm-song-cover">
            {song.coverImageUrl
              ? <img alt={`${song.title} cover artwork`} src={song.coverImageUrl} />
              : <div aria-label={`No cover artwork available for ${song.title}`} className="rhythm-song-cover__fallback" role="img">No cover</div>}
          </div>
          <div className="rhythm-song-info">
            <h2 id={titleId}>{song.title}</h2>
            <p className="rhythm-song-artist">{song.artist || 'Artist unavailable'}</p>
            <p className="rhythm-song-context">
              {metadata.map((item, index) => <span key={`${index}:${item}`}>
                {index > 0 ? <span aria-hidden="true" className="rhythm-song-context__separator">•</span> : null}
                {item}
              </span>)}
            </p>
            <p className="rhythm-song-summary">{song.difficulties.length} {song.difficulties.length === 1 ? 'difficulty' : 'difficulties'} available</p>
          </div>
          <div aria-label={`Available difficulties for ${song.title}`} className="rhythm-song-actions">
            {song.difficulties.map((beatmap) => {
              const difficulty = difficultyLabel(beatmap.difficulty)
              const noteCount = beatmap.published?.noteCount ?? beatmap.noteCount
              const noteLabel = Number.isFinite(Number(noteCount)) ? `${Number(noteCount)} notes` : 'Notes unavailable'
              return <Link
                aria-label={`Play ${song.title} on ${difficulty} difficulty`}
                className={`rhythm-difficulty-link is-${beatmap.difficulty.toLowerCase()}`}
                key={beatmap.difficulty}
                to={`/game/${song.id}?difficulty=${beatmap.difficulty}`}
              >
                <span>{difficulty}</span>
                <small>{noteLabel}</small>
                <Play aria-hidden="true" size={16} />
              </Link>
            })}
          </div>
        </article>
      })}
      </section>
    </> : null}
  </div>
}
