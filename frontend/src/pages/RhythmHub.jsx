import { useEffect, useMemo, useState } from 'react'
import { Play, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { getPublishedSongs } from '../services/publicSongService'
import { getBeatmapSummary } from '../services/beatmapService'
import { getMyScores, getMyRhythmSummary } from '../services/scoreService'
import { getUserBadges } from '../services/badgeService'

const DIFFICULTY_ORDER = ['EASY', 'MEDIUM', 'HARD']
const difficultyLabel = (value) => value[0] + value.slice(1).toLowerCase()

function formatDuration(value) {
  const seconds = Math.floor(Number(value))
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function groupPublishedBeatmapsBySong(entries) {
  const grouped = new Map()
  entries.forEach(({ beatmaps, song }) => beatmaps.filter((map) => map.status === 'PUBLISHED').forEach((map) => {
    const item = grouped.get(song.id) || { ...song, difficulties: [] }
    if (!item.difficulties.some(({ difficulty }) => difficulty === map.difficulty)) item.difficulties.push(map)
    grouped.set(song.id, item)
  }))
  return [...grouped.values()].map((song) => ({
    ...song,
    difficulties: song.difficulties.sort((a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty)),
  }))
}

function bestScores(scores) {
  const result = new Map()
  scores.forEach((score) => {
    const key = `${score.songId}:${score.difficulty}`
    if (!result.has(key) || Number(score.score) > Number(result.get(key).score)) result.set(key, score)
  })
  return result
}

export default function RhythmHub() {
  const { token, user } = useAuth()
  const [songs, setSongs] = useState([])
  const [scores, setScores] = useState([])
  const [summary, setSummary] = useState(null)
  const [badgeCount, setBadgeCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    let active = true
    getPublishedSongs()
      .then((data) => Promise.all(data.filter((song) => song.audioUrl && Number(song.durationSecs) >= 5)
        .map(async (song) => ({ beatmaps: await getBeatmapSummary(song.id).catch(() => []), song }))))
      .then((entries) => active && setSongs(groupPublishedBeatmapsBySong(entries)))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user || !token) return undefined
    let active = true
    Promise.allSettled([getMyScores(token), getMyRhythmSummary(user.id, token), getUserBadges(user.id, token)])
      .then(([scoreResult, summaryResult, badgeResult]) => {
        if (!active) return
        if (scoreResult.status === 'fulfilled') setScores(scoreResult.value)
        if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value)
        if (badgeResult.status === 'fulfilled') setBadgeCount(badgeResult.value.length)
      })
    return () => { active = false }
  }, [token, user])

  const personalBests = useMemo(() => bestScores(scores), [scores])
  const visibleSongs = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return [...songs].filter((song) => {
      if (normalized && !`${song.title || ''} ${song.artist || ''}`.toLowerCase().includes(normalized)) return false
      if (filter.startsWith('difficulty:') && !song.difficulties.some((map) => map.difficulty === filter.split(':')[1])) return false
      if (filter.startsWith('language:') && !(song.languages || []).includes(filter.split(':')[1])) return false
      if (filter === 'played' && !scores.some((score) => score.songId === song.id)) return false
      if (filter === 'unplayed' && scores.some((score) => score.songId === song.id)) return false
      return true
    }).sort((a, b) => {
      if (sortBy === 'title') return String(a.title || '').localeCompare(String(b.title || ''))
      if (sortBy === 'artist') return String(a.artist || '').localeCompare(String(b.artist || '')) || String(a.title || '').localeCompare(String(b.title || ''))
      return (Date.parse(b.publishedDate) || 0) - (Date.parse(a.publishedDate) || 0)
    })
  }, [filter, query, scores, songs, sortBy])

  const languages = useMemo(() => [...new Set(songs.flatMap((song) => song.languages || []))].sort(), [songs])
  const lastScore = scores[0]
  const lastSong = lastScore && songs.find((song) => song.id === lastScore.songId)
  const songsPlayed = new Set(scores.map((score) => score.songId)).size

  return <div className="page-stack rhythm-hub">
    <PageHeader description="Play Singapore’s stories through rhythm." eyebrow="Rhythm Game" title="Rhythm Game" />

    {user ? <>
      {(songsPlayed > 0 || badgeCount > 0 || summary?.bestLeaderboardRank) ? <dl aria-label="Your rhythm progress" className="rhythm-progress-summary">
        {songsPlayed > 0 ? <div><dt>Songs played</dt><dd>{songsPlayed}</dd></div> : null}
        {badgeCount > 0 ? <div><dt>Badges earned</dt><dd>{badgeCount}</dd></div> : null}
        {summary?.bestLeaderboardRank ? <div><dt>Best leaderboard rank</dt><dd>#{summary.bestLeaderboardRank.position}</dd></div> : null}
      </dl> : null}
    </> : <p className="rhythm-guest-note">Playing as a guest — scores will not be saved. <Link to="/login">Log in</Link> to save progress, earn badges and join the leaderboard.</p>}

    {user && lastSong ? <section aria-labelledby="continue-rhythm-title" className="rhythm-continue">
      <div><p className="eyebrow">Continue Playing</p><h2 id="continue-rhythm-title">{lastSong.title}</h2>
        <p>{difficultyLabel(lastScore.difficulty)} · Personal best: {Number(personalBests.get(`${lastSong.id}:${lastScore.difficulty}`)?.score || 0).toLocaleString()}</p></div>
      <Link className="rhythm-leaderboard-action rhythm-leaderboard-action--primary" to={`/game/${lastSong.id}?difficulty=${lastScore.difficulty}`}>Play again</Link>
    </section> : null}

    {songs.length > 0 ? <div aria-label="Find and filter rhythm games" className="rhythm-list-toolbar">
      <label className="rhythm-search"><span>Search songs</span><div><Search aria-hidden="true" size={17} /><input onChange={(event) => setQuery(event.target.value)} placeholder="Song title or artist" type="search" value={query} /></div></label>
      <label><span>Filters</span><select onChange={(event) => setFilter(event.target.value)} value={filter}>
        <option value="all">All songs</option>
        {user ? <><option value="played">Played</option><option value="unplayed">Unplayed</option></> : null}
        {DIFFICULTY_ORDER.map((difficulty) => <option key={difficulty} value={`difficulty:${difficulty}`}>{difficultyLabel(difficulty)} available</option>)}
        {languages.map((language) => <option key={language} value={`language:${language}`}>{language}</option>)}
      </select></label>
      <label><span>Sort by</span><select id="rhythm-sort" onChange={(event) => setSortBy(event.target.value)} value={sortBy}><option value="newest">Newest</option><option value="title">Title</option><option value="artist">Artist</option></select></label>
      <Link className="rhythm-leaderboard-action" to="/rhythm-game/leaderboard">View Leaderboard</Link>
    </div> : null}

    {loading ? <div className="rhythm-loading" role="status"><span />Loading rhythm games…</div> : null}
    {error ? <div className="state-box" role="alert"><strong>Rhythm games are unavailable</strong><span>Please try again in a moment.</span></div> : null}
    {!loading && !error && songs.length === 0 ? <EmptyState description="Published songs with rhythm tracks will appear here." title="No rhythm games yet" /> : null}
    {!loading && !error && songs.length > 0 && visibleSongs.length === 0 ? <EmptyState description="Try another title, artist, or filter." title="No songs match your search" /> : null}

    {visibleSongs.length > 0 ? <section aria-label="Published rhythm games" className="rhythm-song-list">{visibleSongs.map((song) => {
      const titleId = `rhythm-song-${song.id}`
      const metadata = [song.theme, (song.languages || []).join(', '), formatDuration(song.durationSecs)].filter(Boolean)
      return <article aria-labelledby={titleId} className="rhythm-song-row" key={song.id}>
        <div className="rhythm-song-cover">{song.coverImageUrl ? <img alt={`${song.title} cover artwork`} src={song.coverImageUrl} /> : <div aria-label={`No cover artwork available for ${song.title}`} className="rhythm-song-cover__fallback" role="img">No cover</div>}</div>
        <div className="rhythm-song-info"><h2 id={titleId}>{song.title}</h2><p className="rhythm-song-artist">{song.artist || 'Artist unavailable'}</p>
          {song.creator ? <Link aria-label={`View ${song.creator.displayName}'s creator profile`} className="rhythm-song-creator" to={`/creators/${song.creator.id}`}>
            <img alt="" src={song.creator.avatarUrl || '/images/Default_pfp.jpg'} /><span>Experience by <strong>{song.creator.displayName}</strong></span>
          </Link> : null}
          <p className="rhythm-song-context">{metadata.map((item, index) => <span key={item}>{index ? <span aria-hidden="true" className="rhythm-song-context__separator">•</span> : null}{item}</span>)}</p>
          <p className="rhythm-song-summary">{user ? (scores.some((score) => score.songId === song.id) ? 'Played' : 'Not played') : 'Scores not saved for guests'}</p>
        </div>
        <div aria-label={`Available difficulties for ${song.title}`} className="rhythm-song-actions">{song.difficulties.map((beatmap) => {
          const difficulty = difficultyLabel(beatmap.difficulty)
          const count = beatmap.published?.noteCount ?? beatmap.noteCount
          const best = personalBests.get(`${song.id}:${beatmap.difficulty}`)
          return <Link aria-label={`Play ${song.title} on ${difficulty} difficulty`} className={`rhythm-difficulty-link is-${beatmap.difficulty.toLowerCase()}`} key={beatmap.difficulty} to={`/game/${song.id}?difficulty=${beatmap.difficulty}`}>
            <span>{difficulty}</span><small>{Number.isFinite(Number(count)) ? `${Number(count)} notes` : 'Notes unavailable'}</small><small className="rhythm-difficulty-best">{user ? (best ? `Best: ${Number(best.score).toLocaleString()}` : 'Not played') : 'Play as guest'}</small><Play aria-hidden="true" size={16} />
          </Link>
        })}</div>
      </article>
    })}</section> : null}
  </div>
}
