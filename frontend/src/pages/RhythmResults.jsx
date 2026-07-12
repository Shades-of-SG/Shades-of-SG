import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { readStoredResult } from '../game/results'
import { fetchSongDetails } from '../game/songDetailsApi'

function getInitials(title) {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export default function RhythmResults() {
  const { songId } = useParams()
  const location = useLocation()
  const result = location.state?.result || readStoredResult(songId)
  const [songDetails, setSongDetails] = useState(null)

  useEffect(() => {
    let ignore = false

    fetchSongDetails(songId)
      .then((song) => {
        if (!ignore) {
          setSongDetails(song)
        }
      })
      .catch(() => {
        if (!ignore) {
          setSongDetails({ id: songId, theme: '', thumbnailUrl: '', title: 'Published song unavailable' })
        }
      })

    return () => {
      ignore = true
    }
  }, [songId])

  const breakdown = useMemo(() => {
    if (!result) {
      return null
    }

    const totalNotes = result.totalNotes || 0
    const estimatedHits = Math.round((totalNotes * result.accuracy) / 100)
    const perfectHits = result.perfectHits ?? 0
    const goodHits = result.goodHits ?? Math.max(estimatedHits - perfectHits, 0)
    const misses = result.misses ?? Math.max(totalNotes - estimatedHits, 0)

    return {
      goodHits,
      misses,
      perfectHits,
      totalNotes,
    }
  }, [result])

  if (!result) {
    return (
      <main className="results-page">
        <section className="results-card empty-results-card">
          <p className="eyebrow">Results</p>
          <h1>No score yet</h1>
          <p>Play the chart first, then your result will appear here.</p>
          <Link to={`/game/${songId}`}>Start game</Link>
        </section>
      </main>
    )
  }

  const title = songDetails?.title || 'Published song unavailable'
  const theme = songDetails?.theme || 'Unavailable'

  return (
    <main className="results-page">
      <section className="results-card rhythm-results-card">
        <div className={`rank-badge rank-${result.rank.toLowerCase()}`}>{result.rank}</div>

        <section className="result-song-summary" aria-label="Song summary">
          <div
            className="result-thumbnail"
            style={songDetails?.thumbnailUrl ? { backgroundImage: `url(${songDetails.thumbnailUrl})` } : undefined}
          >
            {!songDetails?.thumbnailUrl && <span>{getInitials(title)}</span>}
          </div>
          <div>
            <p className="eyebrow">Song Completed</p>
            <h1>{title}</h1>
            <p>Theme: {theme}</p>
          </div>
        </section>

        <div className="result-grid">
          <div>
            <span>Score</span>
            <strong>{result.score.toLocaleString()}</strong>
          </div>
          <div>
            <span>Accuracy</span>
            <strong>{result.accuracy}%</strong>
          </div>
          <div>
            <span>Max combo</span>
            <strong>{result.maxCombo}</strong>
          </div>
          <div>
            <span>Difficulty</span>
            <strong>{result.difficulty}</strong>
          </div>
        </div>

        <section className="performance-breakdown" aria-label="Performance breakdown">
          <h2>Performance breakdown</h2>
          <div>
            <span>Perfect hits</span>
            <strong>{breakdown.perfectHits}</strong>
          </div>
          <div>
            <span>Good hits</span>
            <strong>{breakdown.goodHits}</strong>
          </div>
          <div>
            <span>Misses</span>
            <strong>{breakdown.misses}</strong>
          </div>
          <div>
            <span>Accuracy</span>
            <strong>{result.accuracy}%</strong>
          </div>
        </section>

        <section className="reflection-cta">
          <p className="eyebrow">Reflection Wall</p>
          <h2>What memories did this song bring back?</h2>
          <p>Share a short reflection and connect your rhythm result back to the story of the song.</p>
          <Link to={`/reflections?song_id=${encodeURIComponent(songId)}`}>Write Reflection</Link>
        </section>

        <div className="result-actions">
          <Link to={`/game/${songId}`}>Play Again</Link>
          <Link to={`/songs/${songId}`}>Back to Song</Link>
        </div>
      </section>
    </main>
  )
}
