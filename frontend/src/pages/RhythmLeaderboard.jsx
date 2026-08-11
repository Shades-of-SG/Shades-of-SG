import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLeaderboard } from '../services/leaderboardService'
import './RhythmLeaderboard.css'

const PERIODS = [
  { label: 'All Time', value: 'all-time' },
  { label: 'This Week', value: 'weekly' },
  { label: 'This Month', value: 'monthly' },
]

function difficultyLabel(value) {
  return value ? value[0] + value.slice(1).toLowerCase() : ''
}

function formatAccuracy(value) {
  const accuracy = Number(value)
  return Number.isFinite(accuracy) ? `${accuracy.toFixed(2)}%` : 'Unavailable'
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function RhythmLeaderboard() {
  const { token, user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryString = searchParams.toString()
  const songId = searchParams.get('songId') || ''
  const difficulty = String(searchParams.get('difficulty') || '').toUpperCase()
  const period = searchParams.get('period') || 'all-time'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [songSearch, setSongSearch] = useState('')
  const [songPage, setSongPage] = useState(1)
  const [songOptions, setSongOptions] = useState([])
  const [songPickerOpen, setSongPickerOpen] = useState(false)
  const [songInput, setSongInput] = useState('')
  const songPickerRef = useRef(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      getLeaderboard({ difficulty, period, songId, songPage, songSearch, token })
        .then((value) => {
          if (!active) return
          setData(value)
          setSongOptions((current) => {
            if (songPage === 1) return value.songs || []
            const known = new Set(current.map((song) => song.id))
            return [...current, ...(value.songs || []).filter((song) => !known.has(song.id))]
          })
          const canonical = new URLSearchParams()
          if (value.selectedSong?.id) canonical.set('songId', value.selectedSong.id)
          if (value.selectedDifficulty) canonical.set('difficulty', value.selectedDifficulty)
          canonical.set('period', value.period || period)
          if (canonical.toString() !== queryString) setSearchParams(canonical, { replace: true })
        })
        .catch((nextError) => {
          if (active) setError(nextError.message)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [difficulty, period, queryString, setSearchParams, songId, songPage, songSearch, token])

  function setFilters(values) {
    const next = new URLSearchParams(searchParams)
    Object.entries(values).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    setSearchParams(next)
  }

  function changeSong(nextSongId) {
    const song = songOptions.find((item) => item.id === nextSongId)
    if (!song) return
    setSongInput('')
    setSongSearch('')
    setSongPage(1)
    setSongPickerOpen(false)
    setFilters({ difficulty: song?.difficulties?.[0] || '', songId: nextSongId })
  }

  const entries = data?.entries || []
  const selectedSong = data?.selectedSong || null
  const selectedDifficulty = data?.selectedDifficulty || difficulty
  const availableDifficulties = data?.availableDifficulties || []
  const visibleSongOptions = songOptions.filter((song) => (
    !songInput.trim() || song.title.toLowerCase().includes(songInput.trim().toLowerCase())
  ))
  const contextLabel = selectedSong && selectedDifficulty ? `${selectedSong.title} · ${difficultyLabel(selectedDifficulty)}` : ''
  const playPath = selectedSong && selectedDifficulty
    ? `/game/${selectedSong.id}?difficulty=${encodeURIComponent(selectedDifficulty)}`
    : ''

  return (
    <div className="page-stack rhythm-leaderboard-page">
      <header className="rhythm-leaderboard-header">
        <p className="eyebrow">Rhythm Game</p>
        <h1>Leaderboard</h1>
        <p>Compare each player&apos;s best result on the same song, difficulty, and time period.</p>
      </header>

      {data ? (
        <section aria-label="Leaderboard filters" className="rhythm-leaderboard-filters">
          <div
            className="rhythm-song-picker rhythm-leaderboard-filter-field"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSongPickerOpen(false)
            }}
            ref={songPickerRef}
          >
            <span id="leaderboard-song-label">Song</span>
            <button
              aria-controls="leaderboard-song-options"
              aria-expanded={songPickerOpen}
              aria-haspopup="listbox"
              aria-labelledby="leaderboard-song-label leaderboard-song-picker"
              id="leaderboard-song-picker"
              onClick={() => {
                setSongPickerOpen((open) => !open)
                if (!songPickerOpen) {
                  setSongInput('')
                  setSongSearch('')
                  setSongPage(1)
                }
              }}
              role="combobox"
              type="button"
            >
              <span>{selectedSong?.title || 'Select a song'}</span>
              <ChevronDown aria-hidden="true" size={18} />
            </button>
            {songPickerOpen ? <div className="rhythm-song-picker__menu">
              <div className="rhythm-song-picker__search">
                <Search aria-hidden="true" size={17} />
                <input
                  aria-label="Search songs"
                  autoComplete="off"
                  autoFocus
                  onChange={(event) => {
                    setSongInput(event.target.value)
                    setSongSearch(event.target.value)
                    setSongPage(1)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setSongPickerOpen(false)
                      songPickerRef.current?.querySelector('[role="combobox"]')?.focus()
                    }
                  }}
                  placeholder="Search songs"
                  type="search"
                  value={songInput}
                />
              </div>
              <div className="rhythm-song-picker__options" id="leaderboard-song-options" role="listbox">
                {visibleSongOptions.length > 0 ? visibleSongOptions.map((song) => (
                  <button
                    aria-selected={song.id === selectedSong?.id}
                    className={song.id === selectedSong?.id ? 'is-selected' : ''}
                    key={song.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => changeSong(song.id)}
                    role="option"
                    type="button"
                  >
                    {song.title}
                  </button>
                )) : <p>No songs found</p>}
                {data.songPagination?.hasNextPage ? <button className="rhythm-song-picker__more" onMouseDown={(event) => event.preventDefault()} onClick={() => setSongPage((value) => value + 1)} type="button">Load more songs</button> : null}
              </div>
            </div> : null}
          </div>
          <label>
            <span>Difficulty</span>
            <select onChange={(event) => setFilters({ difficulty: event.target.value })} value={selectedDifficulty || ''}>
              {selectedDifficulty && !availableDifficulties.includes(selectedDifficulty) ? <option disabled value={selectedDifficulty}>{difficultyLabel(selectedDifficulty)} — unavailable</option> : null}
              {availableDifficulties.map((item) => <option key={item} value={item}>{difficultyLabel(item)}</option>)}
            </select>
          </label>
          <label>
            <span>Time period</span>
            <select onChange={(event) => setFilters({ period: event.target.value })} value={data.period || period}>
              {PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </section>
      ) : null}

      {loading ? <div className="rhythm-leaderboard-state rhythm-leaderboard-loading" role="status">Loading leaderboard…</div> : null}
      {error ? <div className="state-box rhythm-leaderboard-state is-error" role="alert"><strong>Leaderboard unavailable</strong><span>{error}</span></div> : null}

      {!loading && !error && data && !data.songs?.length ? (
        <div className="state-box rhythm-leaderboard-state"><strong>No published rhythm leaderboards yet</strong><span>Published songs with published beatmaps will appear here.</span></div>
      ) : null}

      {!loading && !error && data && !data.difficultyAvailable ? (
        <div className="state-box rhythm-leaderboard-state"><strong>Difficulty unavailable</strong><span>{difficultyLabel(selectedDifficulty)} is not published for {selectedSong?.title}. Choose one of the available difficulties above.</span></div>
      ) : null}

      {!loading && !error && data?.difficultyAvailable && user ? (
        data.currentUser ? (
          <section className="rhythm-my-ranking">
            <div>
              <span>Your Rank for {contextLabel}</span>
              <strong>#{data.currentUser.position}</strong>
            </div>
            <div>
              <strong>{data.currentUser.score.toLocaleString()} points</strong>
              <span>{formatAccuracy(data.currentUser.accuracy)} accuracy</span>
              <span>{data.currentUser.position} of {data.totalRankedPlayers} ranked {data.totalRankedPlayers === 1 ? 'player' : 'players'}</span>
            </div>
          </section>
        ) : (
          <section className="rhythm-my-ranking rhythm-my-ranking--empty">
            <div><span>Your Rank for {contextLabel}</span><strong>Not ranked yet</strong></div>
            <p>Complete this chart to join the leaderboard.</p>
          </section>
        )
      ) : null}

      {!loading && !error && data?.difficultyAvailable && entries.length === 0 ? (
        <div className="state-box rhythm-leaderboard-state"><strong>No scores for this selection</strong><span>Be the first ranked player for {contextLabel}.</span></div>
      ) : null}

      {!loading && !error && entries.length > 0 ? (
        <section aria-label={`Leaderboard for ${contextLabel}`} className="rhythm-leaderboard-list">
          <header className="rhythm-leaderboard-list__header">
            <span>Rank</span><span>Player</span><span>Performance</span><span>Achieved</span>
          </header>
          {entries.map((entry) => (
            <article className={`rhythm-leaderboard-entry is-top-${Math.min(entry.position, 4)}${entry.isCurrentUser ? ' is-current-user' : ''}`} key={`${entry.position}:${entry.userId || 'anonymous'}:${entry.achievedAt}`}>
              <strong className="rhythm-leaderboard-position">#{entry.position}</strong>
              <div className="rhythm-leaderboard-identity">
                <img alt="" className="rhythm-leaderboard-avatar" src={entry.avatarUrl || '/images/Default_pfp.jpg'} />
                <div className="rhythm-leaderboard-player">
                  {entry.userId ? <Link to={`/users/${entry.userId}`}>{entry.displayName}</Link> : <strong>{entry.displayName || 'Anonymous Player'}</strong>}
                  <span>{difficultyLabel(entry.difficulty)} · Grade {entry.grade}</span>
                </div>
              </div>
              <div className="rhythm-leaderboard-score">
                <strong>{entry.score.toLocaleString()} points</strong>
                <span>{formatAccuracy(entry.accuracy)} accuracy · {entry.maxCombo.toLocaleString()} max combo</span>
              </div>
              <time dateTime={entry.achievedAt}>{formatDate(entry.achievedAt)}</time>
            </article>
          ))}
        </section>
      ) : null}

      <div className="rhythm-leaderboard-actions">
        {playPath ? <Link className="rhythm-leaderboard-action rhythm-leaderboard-action--primary" to={playPath}>Play This Song</Link> : null}
        <Link className="rhythm-leaderboard-action" to="/rhythm-game">Back to Rhythm Games</Link>
      </div>
    </div>
  )
}
