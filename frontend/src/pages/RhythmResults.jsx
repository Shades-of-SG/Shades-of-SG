import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { readStoredResult } from '../game/results'
import { fetchSongDetails } from '../game/songDetailsApi'
import { queuePendingScore, removePendingScore, saveScore } from '../game/scoresApi'
import { canSubmitScore, createSubmissionGuard } from '../game/scoreSubmission'
import { useAuth } from '../context/AuthContext'

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
  const { token, user } = useAuth()
  const result = location.state?.result || readStoredResult(songId)
  const [songDetails, setSongDetails] = useState(null)
  const [saveState, setSaveState] = useState('idle')
  const [saveError, setSaveError] = useState('')
  const guardRef = useRef(createSubmissionGuard())

  const submitScore = useCallback(async () => {
    if (!canSubmitScore({ result, token, user }) || !guardRef.current.begin(result)) return
    setSaveState('saving')
    setSaveError('')
    try {
      await saveScore(result, token)
      removePendingScore(result)
      setSaveState('saved')
    } catch (error) {
      queuePendingScore(result)
      setSaveError(error.message)
      setSaveState('error')
    }
  }, [result, token, user])

  useEffect(() => {
    const timeout = window.setTimeout(submitScore, 0)
    return () => window.clearTimeout(timeout)
  }, [submitScore])

  useEffect(() => {
    let ignore = false

    fetchSongDetails(songId, { preview: Boolean(result?.preview), token })
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
  }, [result?.preview, songId, token])

  const breakdown = useMemo(() => {
    if (!result) {
      return null
    }

    const totalNotes = result.totalNotes || 0
    const perfectHits = result.perfectHits ?? 0
    const greatHits = result.greatHits ?? 0
    const goodHits = result.goodHits ?? 0
    const badHits = result.badHits ?? 0
    const misses = result.misses ?? Math.max(totalNotes - perfectHits - greatHits - goodHits - badHits, 0)

    return {
      goodHits,
      greatHits,
      badHits,
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
            <span>Great hits</span>
            <strong>{breakdown.greatHits}</strong>
          </div>
          <div>
            <span>Good hits</span>
            <strong>{breakdown.goodHits}</strong>
          </div>
          <div>
            <span>Bad hits</span>
            <strong>{breakdown.badHits}</strong>
          </div>
          <div>
            <span>Misses</span>
            <strong>{breakdown.misses}</strong>
          </div>
          <div>
            <span>Holds completed</span>
            <strong>{result.holdCompletions || 0}</strong>
          </div>
          <div>
            <span>Early releases</span>
            <strong>{result.earlyReleases || 0}</strong>
          </div>
        </section>

        <section className="score-save-status" aria-live="polite">
          {saveState === 'saving' && <p>Saving your score…</p>}
          {saveState === 'saved' && <p>Score saved to your profile.</p>}
          {saveState === 'error' && <p>Score is queued locally. {saveError} <button onClick={() => { guardRef.current.retry(result); submitScore() }} type="button">Retry now</button></p>}
          {result.preview && <p>Draft Preview — this result was not saved and does not affect player statistics.</p>}
          {!result.preview && !token && <p>Your result is saved on this device. Sign in before your next run to save scores to your profile.</p>}
        </section>

        <section className="reflection-cta">
          <p className="eyebrow">Reflection Wall</p>
          <h2>What memories did this song bring back?</h2>
          <p>Share a short reflection and connect your rhythm result back to the story of the song.</p>
          <Link to={`/reflections?song_id=${encodeURIComponent(songId)}`}>Write Reflection</Link>
        </section>

        <div className="result-actions">
          <Link to={result.preview ? `/game/${songId}?difficulty=${result.difficulty}&preview=1` : `/game/${songId}`}>Play Again</Link>
          <Link to={result.preview ? `/creator/studio/${songId}` : `/songs/${songId}`}>{result.preview ? 'Back to Studio' : 'Back to Song'}</Link>
        </div>
      </section>
    </main>
  )
}
