import { useEffect, useMemo, useState } from 'react'
import { Play, Search, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { getBeatmapSummary } from '../services/beatmapService'
import { getPublishedSongs } from '../services/publicSongService'
import { getMyRhythmProgress } from '../services/scoreService'

const DIFFICULTY_ORDER = ['EASY', 'MEDIUM', 'HARD']
const EMPTY_PROGRESS = { bestScores: [], scores: [] }

function difficultyLabel(difficulty) {
  return difficulty[0] + difficulty.slice(1).toLowerCase()
}

function formatDuration(durationSecs) {
  const totalSeconds = Math.floor(Number(durationSecs))
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return ''
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatScore(score) {
  return Number(score).toLocaleString()
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
  const { token, user, userProfile } = useAuth()
  const isAuthenticated = Boolean(token && user)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadVersion, setLoadVersion] = useState(0)
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [progressLoading, setProgressLoading] = useState(isAuthenticated)
  const [progressError, setProgressError] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [playStatus, setPlayStatus] = useState('')

  useEffect(() => {
    let active = true
    getPublishedSongs()
      .then(async (data) => Promise.all(
        data
          .filter((song) => song.audioUrl && Number(song.durationSecs) >= 5)
          .map(async (song) => ({ beatmaps: await getBeatmapSummary(song.id), song })),
      ))
      .then((entries) => active && setSongs(groupPublishedBeatmapsBySong(entries)))
      .catch(() => active && setError('Rhythm games could not be loaded right now. Please try again.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [loadVersion])

  useEffect(() => {
    let active = true
    if (!isAuthenticated) return () => { active = false }
    Promise.resolve()
      .then(() => {
        if (!active) return EMPTY_PROGRESS
        setProgressLoading(true)
        setProgressError(false)
        return getMyRhythmProgress(token)
      })
      .then((data) => active && setProgress(data))
      .catch(() => active && setProgressError(true))
      .finally(() => active && setProgressLoading(false))
    return () => { active = false }
  }, [isAuthenticated, token])

  const bestScoresByChart = useMemo(() => new Map(
    progress.bestScores.map((score) => [`${score.songId}:${score.difficulty}`, score]),
  ), [progress.bestScores])
  const playedSongIds = useMemo(() => new Set(progress.bestScores.map((score) => score.songId)), [progress.bestScores])
  const categories = useMemo(() => [...new Set(songs.map((song) => song.theme).filter(Boolean))].sort(), [songs])
  const languages = useMemo(() => [...new Set(songs.flatMap((song) => song.languages || []).filter(Boolean))].sort(), [songs])
  const progressReady = isAuthenticated && !progressLoading && !progressError
  const visibleSongs = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = songs.filter((song) => {
      const searchable = [song.title, song.artist, song.creator?.displayName].filter(Boolean).join(' ').toLowerCase()
      const hasDifficulty = !difficulty || song.difficulties.some((item) => item.difficulty === difficulty)
      const hasLanguage = !language || (song.languages || []).includes(language)
      const isPlayed = playedSongIds.has(song.id)
      return (!query || searchable.includes(query))
        && (!category || song.theme === category)
        && hasLanguage
        && hasDifficulty
        && (!playStatus || (playStatus === 'played' ? isPlayed : !isPlayed))
    })
    return sortSongs(filtered, sortBy)
  }, [category, difficulty, language, playStatus, playedSongIds, search, songs, sortBy])

  const recentScore = progressReady
    ? progress.scores.find((score) => songs.some((song) => (
        song.id === score.songId && song.difficulties.some((item) => item.difficulty === score.difficulty)
      )))
    : null
  const recentSong = recentScore ? songs.find((song) => song.id === recentScore.songId) : null
  const recentBest = recentScore ? bestScoresByChart.get(`${recentScore.songId}:${recentScore.difficulty}`) : null
  const summaryItems = isAuthenticated ? [
    playedSongIds.size > 0 ? { label: 'Songs played', value: playedSongIds.size } : null,
    (userProfile?.badges?.length || 0) > 0 ? { label: 'Badges earned', value: userProfile.badges.length } : null,
    userProfile?.rhythm?.bestLeaderboardRank?.position
      ? { label: 'Best leaderboard rank', value: `#${userProfile.rhythm.bestLeaderboardRank.position}` }
      : null,
  ].filter(Boolean) : []
  const filtersActive = Boolean(category || language || difficulty || playStatus)

  function clearFilters() {
    setCategory('')
    setLanguage('')
    setDifficulty('')
    setPlayStatus('')
  }

  return <div className="page-stack rhythm-hub">
    <PageHeader
      description="Play Singapore’s stories through rhythm."
      eyebrow="Rhythm Game"
      title="Rhythm Game"
    />

    {!isAuthenticated ? <aside className="rhythm-guest-notice">
      <strong>Playing as a guest</strong>
      <span>You can play any song. <Link to="/login">Log in</Link> to save future scores, track personal bests and join the leaderboard.</span>
    </aside> : null}

    {summaryItems.length > 0 ? <dl aria-label="Your rhythm progress" className="rhythm-progress-summary">
      {summaryItems.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
    </dl> : null}

    {recentSong && recentScore ? <section aria-labelledby="continue-playing-title" className="rhythm-continue-card">
      <div>
        <p className="eyebrow">Continue Playing</p>
        <h2 id="continue-playing-title">{recentSong.title}</h2>
        <p>{difficultyLabel(recentScore.difficulty)} · Personal best {formatScore(recentBest?.score ?? recentScore.score)}</p>
      </div>
      <Link className="rhythm-continue-action" to={`/game/${recentSong.id}?difficulty=${recentScore.difficulty}`}>Play again <Play aria-hidden="true" size={16} /></Link>
    </section> : null}

    {!loading && !error && songs.length > 0 ? <section aria-label="Find rhythm games" className="rhythm-controls">
      <div className="rhythm-controls__primary">
        <label className="rhythm-search" htmlFor="rhythm-search">
          <span className="sr-only">Search by song title or artist</span>
          <Search aria-hidden="true" size={18} />
          <input id="rhythm-search" onChange={(event) => setSearch(event.target.value)} placeholder="Search title or artist" type="search" value={search} />
        </label>
        <button aria-expanded={filtersOpen} className={filtersActive ? 'is-active' : ''} onClick={() => setFiltersOpen((open) => !open)} type="button">
          <SlidersHorizontal aria-hidden="true" size={17} /> Filters{filtersActive ? ' · On' : ''}
        </button>
        <label className="rhythm-sort" htmlFor="rhythm-sort">
          <span>Sort by</span>
          <select id="rhythm-sort" onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
            <option value="newest">Newest</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
          </select>
        </label>
        <Link className="rhythm-leaderboard-action rhythm-leaderboard-action--primary" to="/rhythm-game/leaderboard">View Leaderboard</Link>
      </div>
      {filtersOpen ? <div className="rhythm-filter-panel">
        <label><span>Category</span><select onChange={(event) => setCategory(event.target.value)} value={category}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Language</span><select onChange={(event) => setLanguage(event.target.value)} value={language}><option value="">All languages</option>{languages.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Difficulty</span><select onChange={(event) => setDifficulty(event.target.value)} value={difficulty}><option value="">Any difficulty</option>{DIFFICULTY_ORDER.map((item) => <option key={item} value={item}>{difficultyLabel(item)}</option>)}</select></label>
        {isAuthenticated && progressReady ? <label><span>Progress</span><select onChange={(event) => setPlayStatus(event.target.value)} value={playStatus}><option value="">Played or unplayed</option><option value="played">Played</option><option value="unplayed">Not played</option></select></label> : null}
        {filtersActive ? <button className="rhythm-clear-filters" onClick={clearFilters} type="button">Clear filters</button> : null}
      </div> : null}
    </section> : null}

    {loading ? <div aria-live="polite" className="rhythm-loading-state" role="status"><span />Loading rhythm games…</div> : null}
    {error ? <div className="state-box rhythm-error-state" role="alert"><strong>Rhythm games unavailable</strong><p>{error}</p><button onClick={() => { setLoading(true); setError(''); setLoadVersion((value) => value + 1) }} type="button">Try again</button></div> : null}
    {!loading && !error && songs.length === 0 ? <EmptyState description="Published songs with a playable rhythm track will appear here." title="No published rhythm games yet" /> : null}
    {!loading && !error && songs.length > 0 && visibleSongs.length === 0 ? <div className="state-box rhythm-search-empty">
      <strong>No songs match your search</strong>
      <p>Try another title or artist, or clear the active filters.</p>
      <button onClick={() => { setSearch(''); clearFilters() }} type="button">Clear search and filters</button>
    </div> : null}

    {progressError ? <p className="rhythm-progress-error" role="status">Your saved progress is temporarily unavailable. You can still choose a song and play.</p> : null}

    {visibleSongs.length > 0 ? <section aria-label="Published rhythm games" className="rhythm-song-list">
      {visibleSongs.map((song) => {
        const titleId = `rhythm-song-${song.id}`
        const duration = formatDuration(song.durationSecs)
        const metadata = [song.theme, (song.languages || []).join(', '), duration].filter(Boolean)
        const playedDifficulties = song.difficulties.filter((item) => bestScoresByChart.has(`${song.id}:${item.difficulty}`)).length
        const summary = !progressReady
          ? progressLoading ? 'Loading progress…' : 'Progress unavailable'
          : playedDifficulties > 0 ? `${playedDifficulties} of ${song.difficulties.length} played` : 'Not played'
        return <article aria-labelledby={titleId} className="rhythm-song-row" key={song.id}>
          <div className="rhythm-song-cover">
            {song.coverImageUrl
              ? <img alt={`${song.title} cover artwork`} src={song.coverImageUrl} />
              : <div aria-label={`No cover artwork available for ${song.title}`} className="rhythm-song-cover__fallback" role="img">No cover</div>}
          </div>
          <div className="rhythm-song-info">
            <h2 id={titleId}>{song.title}</h2>
            <p className="rhythm-song-artist">{song.artist || 'Performing artist unavailable'}</p>
            {song.creator ? <div className="rhythm-song-creator">
              <img alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/Default_pfp.jpg' }} src={song.creator.avatarUrl || '/images/Default_pfp.jpg'} />
              <span>Experience by <Link aria-label={`View ${song.creator.displayName}’s creator profile`} to={`/creators/${song.creator.id}`}>{song.creator.displayName}</Link></span>
            </div> : null}
            <p className="rhythm-song-context">
              {metadata.map((item, index) => <span key={`${index}:${item}`}>
                {index > 0 ? <span aria-hidden="true" className="rhythm-song-context__separator">•</span> : null}
                {item}
              </span>)}
            </p>
            {isAuthenticated ? <p className="rhythm-song-summary">{summary}</p> : null}
          </div>
          <div aria-label={`Available difficulties for ${song.title}`} className="rhythm-song-actions">
            {song.difficulties.map((beatmap) => {
              const label = difficultyLabel(beatmap.difficulty)
              const noteCount = beatmap.published?.noteCount ?? beatmap.noteCount
              const noteLabel = Number.isFinite(Number(noteCount)) ? `${Number(noteCount)} notes` : 'Notes unavailable'
              const best = bestScoresByChart.get(`${song.id}:${beatmap.difficulty}`)
              const scoreLabel = progressReady ? (best ? `Best: ${formatScore(best.score)}` : 'Not played') : ''
              return <Link
                aria-label={`Play ${song.title} on ${label} difficulty`}
                className={`rhythm-difficulty-link is-${beatmap.difficulty.toLowerCase()}`}
                key={beatmap.difficulty}
                to={`/game/${song.id}?difficulty=${beatmap.difficulty}`}
              >
                <span>{label}</span>
                <small>{noteLabel}</small>
                {scoreLabel ? <small className="rhythm-difficulty-progress">{scoreLabel}</small> : null}
                <Play aria-hidden="true" size={16} />
              </Link>
            })}
          </div>
        </article>
      })}
    </section> : null}
  </div>
}
