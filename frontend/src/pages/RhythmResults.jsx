import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { readStoredResult } from '../game/results'
import { canSubmitScore, createSubmissionGuard } from '../game/scoreSubmission'
import { fetchSongDetails } from '../game/songDetailsApi'
import { queuePendingScore, removePendingScore, saveScore } from '../game/scoresApi'
import { getLeaderboard } from '../services/leaderboardService'
import { getMyRhythmProgress } from '../services/scoreService'
import { readPendingScoreClaim } from '../services/pendingScoreClaim'
import { storeRegistrationReturn } from '../services/safeReturnPath'

const JUDGEMENT_METRICS = [
  { key: 'perfectHits', label: 'Perfect hits' },
  { key: 'greatHits', label: 'Great hits' },
  { key: 'goodHits', label: 'Good hits' },
  { key: 'badHits', label: 'Bad hits' },
  { key: 'misses', label: 'Misses' },
]

const GRADE_MESSAGES = {
  A: 'Amazing performance!',
  B: 'Great performance!',
  C: 'Nice effort!',
  S: 'Outstanding!',
}

function getInitials(title = '') {
  return String(title)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'SG'
}

function numericMetric(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

function formatScore(value) {
  return numericMetric(value).toLocaleString()
}

function isDisplayableResult(result) {
  return Boolean(
    result
    && Number.isFinite(Number(result.score))
    && Number.isFinite(Number(result.accuracy))
    && typeof result.rank === 'string'
    && result.rank.trim()
    && typeof result.difficulty === 'string'
    && result.difficulty.trim(),
  )
}

export default function RhythmResults() {
  const { songId } = useParams()
  const location = useLocation()
  const { refreshProfile, token, user } = useAuth()
  const result = location.state?.result || (token ? readStoredResult(songId) : null)
  const [songDetails, setSongDetails] = useState(null)
  const [songState, setSongState] = useState('loading')
  const [saveState, setSaveState] = useState('idle')
  const [achievementDetails, setAchievementDetails] = useState(null)
  const guardRef = useRef(createSubmissionGuard())

  const submitScore = useCallback(async () => {
    if (!canSubmitScore({ result, token, user }) || !guardRef.current.begin(result)) return
    setSaveState('saving')

    let progressBefore = null
    try {
      progressBefore = await getMyRhythmProgress(token)
    } catch {
      // Saving the completed run must not depend on optional progress context.
    }

    try {
      await saveScore(result, token)
      removePendingScore(result)
      setSaveState('saved')
      refreshProfile().catch((error) => console.error('[Rhythm profile refresh]', error))

      const previousEntry = progressBefore?.bestScores?.find((score) => (
        score.songId === result.songId && score.difficulty === result.difficulty
      ))
      const hasPreviousBest = Number.isFinite(Number(previousEntry?.score))
      const previousBest = hasPreviousBest ? Number(previousEntry.score) : null
      const currentScore = Number(result.score)
      const nextDetails = progressBefore ? {
        isNewPersonalBest: !hasPreviousBest || currentScore > previousBest,
        personalBest: hasPreviousBest ? Math.max(currentScore, previousBest) : currentScore,
        previousBest,
      } : {}
      setAchievementDetails(Object.keys(nextDetails).length ? nextDetails : null)

      try {
        const leaderboard = await getLeaderboard({
          difficulty: result.difficulty,
          period: 'all-time',
          songId: result.songId,
          token,
        })
        if (Number.isInteger(leaderboard?.currentUser?.position)) {
          setAchievementDetails((current) => ({
            ...(current || {}),
            leaderboardRank: leaderboard.currentUser.position,
          }))
        }
      } catch {
        // The result remains valid when optional leaderboard context is unavailable.
      }

    } catch {
      queuePendingScore(result)
      setSaveState('error')
    }
  }, [refreshProfile, result, token, user])

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
          setSongState('ready')
        }
      })
      .catch(() => {
        if (!ignore) {
          setSongDetails(null)
          setSongState('error')
        }
      })

    return () => {
      ignore = true
    }
  }, [result?.preview, songId, token])

  const breakdown = useMemo(() => {
    if (!result) return null

    const totalNotes = numericMetric(result.totalNotes)
    const perfectHits = numericMetric(result.perfectHits)
    const greatHits = numericMetric(result.greatHits)
    const goodHits = numericMetric(result.goodHits)
    const badHits = numericMetric(result.badHits)
    const misses = result.misses === undefined
      ? Math.max(totalNotes - perfectHits - greatHits - goodHits - badHits, 0)
      : numericMetric(result.misses)

    return { badHits, goodHits, greatHits, misses, perfectHits }
  }, [result])

  if (!isDisplayableResult(result)) {
    return (
      <div className="results-page">
        <section className="results-card empty-results-card" aria-labelledby="empty-result-title">
          <p className="eyebrow">Results unavailable</p>
          <h1 id="empty-result-title">Your session result has expired</h1>
          <p>Play another chart when you are ready. Guest results are available only for the session in which they were completed.</p>
          <div className="result-actions result-actions--fallback">
            <Link className="result-action result-action--primary" to="/rhythm-game">Return to Rhythm Games</Link>
          </div>
        </section>
      </div>
    )
  }

  const title = songState === 'loading' ? 'Loading song…' : songDetails?.title || 'Song details unavailable'
  const theme = songDetails?.theme || ''
  const coverImageUrl = songDetails?.coverImageUrl || songDetails?.thumbnailUrl || ''
  const rank = result.rank.toUpperCase()
  const gradeMessage = GRADE_MESSAGES[rank] || 'Keep practising!'
  const judgementTotal = JUDGEMENT_METRICS.reduce((total, metric) => total + breakdown[metric.key], 0)
  const progressMaximum = Math.max(judgementTotal, 1)
  const reflectionPath = `/reflections?song_id=${encodeURIComponent(songId)}&compose=1`
  const pendingClaim = !token ? readPendingScoreClaim() : null
  const canClaimResult = Boolean(
    pendingClaim
    && pendingClaim.songId === result.songId
    && pendingClaim.difficulty === result.difficulty
    && pendingClaim.playedAt === result.playedAt,
  )
  const claimDestination = { pathname: '/rhythm-game/claim' }

  return (
    <div className="results-page">
      <article className={`results-card rhythm-results-card rank-theme-${rank.toLowerCase()}`}>
        <header className="result-hero">
          {['S', 'A'].includes(rank) ? <div aria-hidden="true" className="result-celebration"><span /><span /><span /></div> : null}
          <div className="result-hero__grade-copy">
            <p className="eyebrow">Song Completed</p>
            <div aria-label={`Grade ${rank}`} className={`rank-badge rank-${rank.toLowerCase()}`} role="img">
              <span aria-hidden="true">{rank}</span>
            </div>
            <div>
              <h1>{gradeMessage}</h1>
              <p>You completed the chart with <strong>{result.accuracy}% accuracy</strong>.</p>
            </div>
          </div>

          <section aria-label="Song summary" className="result-song-summary">
            <div className="result-thumbnail">
              {coverImageUrl
                ? <img alt={`${title} cover artwork`} src={coverImageUrl} />
                : <span aria-hidden="true">{getInitials(title)}</span>}
            </div>
            <div>
              <p className="eyebrow">Completed chart</p>
              <h2>{title}</h2>
              {theme ? <p>{theme}</p> : null}
              <dl className="result-song-meta">
                <div><dt>Difficulty</dt><dd>{result.difficulty}</dd></div>
                <div><dt>Accuracy</dt><dd>{result.accuracy}%</dd></div>
              </dl>
              {songState === 'error' ? <p className="result-song-error" role="status">Song details are unavailable, but your result is still here.</p> : null}
            </div>
          </section>
        </header>

        <div className="result-content-grid">
          <section aria-labelledby="score-summary-title" className="result-score-summary">
            <div className="result-section-heading">
              <p className="eyebrow">Your result</p>
              <h2 id="score-summary-title">Score summary</h2>
            </div>
            <div className="result-total-score">
              <span>Total score</span>
              <strong aria-label={`Total score ${formatScore(result.score)}`}>{formatScore(result.score)}</strong>
            </div>
            <dl className="result-stat-grid">
              <div><dt>Accuracy</dt><dd>{result.accuracy}%</dd></div>
              <div><dt>Max combo</dt><dd>{numericMetric(result.maxCombo).toLocaleString()}</dd></div>
              <div><dt>Difficulty</dt><dd>{result.difficulty}</dd></div>
            </dl>

            {saveState === 'saved' && achievementDetails ? <div className="result-achievements" aria-label="Saved score details">
              {achievementDetails.isNewPersonalBest ? <strong className="result-personal-best-badge">New Personal Best</strong> : null}
              <dl>
                {Number.isFinite(achievementDetails.personalBest) ? <div><dt>Personal best</dt><dd>{formatScore(achievementDetails.personalBest)}</dd></div> : null}
                {Number.isFinite(achievementDetails.previousBest) ? <div><dt>Previous best</dt><dd>{formatScore(achievementDetails.previousBest)}</dd></div> : null}
                {Number.isInteger(achievementDetails.leaderboardRank) ? <div><dt>Leaderboard rank</dt><dd>#{achievementDetails.leaderboardRank}</dd></div> : null}
              </dl>
            </div> : null}

            <div className="score-save-status" aria-live="polite">
              {saveState === 'saving' ? <p>Saving your score…</p> : null}
              {saveState === 'saved' ? <p>Score saved to your profile.</p> : null}
              {saveState === 'error' ? <p>Your score is queued on this device. <button onClick={() => { guardRef.current.retry(result); submitScore() }} type="button">Retry now</button></p> : null}
              {result.preview ? <p>Draft Preview — this result was not saved and does not affect player statistics.</p> : null}
            </div>
          </section>

          <section aria-labelledby="performance-breakdown-title" className="performance-breakdown">
            <div className="result-section-heading">
              <p className="eyebrow">Chart details</p>
              <h2 id="performance-breakdown-title">Performance breakdown</h2>
            </div>
            <div className="performance-bars">
              {JUDGEMENT_METRICS.map((metric) => {
                const value = breakdown[metric.key]
                const percentage = judgementTotal ? (value / judgementTotal) * 100 : 0
                return <div className={`performance-row performance-row--${metric.key}`} key={metric.key}>
                  <div><span>{metric.label}</span><strong>{value.toLocaleString()}</strong></div>
                  <div
                    aria-label={`${metric.label}: ${value} of ${judgementTotal} judged notes`}
                    aria-valuemax={progressMaximum}
                    aria-valuemin="0"
                    aria-valuenow={value}
                    className="performance-bar"
                    role="progressbar"
                  >
                    <span style={{ '--result-bar-width': `${percentage}%` }} />
                  </div>
                </div>
              })}
            </div>
            <dl className="performance-extra-stats">
              <div><dt>Holds completed</dt><dd>{numericMetric(result.holdCompletions).toLocaleString()}</dd></div>
              <div><dt>Early releases</dt><dd>{numericMetric(result.earlyReleases).toLocaleString()}</dd></div>
            </dl>
          </section>
        </div>

        {!token && !result.preview ? <section aria-labelledby="guest-save-title" className="result-guest-callout">
          <div>
            <p className="eyebrow">Guest session</p>
            <h2 id="guest-save-title">{canClaimResult ? 'Save This Score' : 'Save Your Future Scores'}</h2>
            <p>{canClaimResult
              ? 'Log in or create an account to save this result, track personal bests, earn badges and join the leaderboard.'
              : 'This result is available for this session only. Log in before your next game to save future scores, track personal bests, earn badges and join the leaderboard.'}</p>
          </div>
          <div className="result-guest-actions">
            <Link className="result-action result-action--primary" state={canClaimResult ? { from: claimDestination } : undefined} to="/login">{canClaimResult ? 'Log In and Save' : 'Log In'}</Link>
            <Link className="result-action result-action--secondary" onClick={canClaimResult ? () => storeRegistrationReturn(claimDestination) : undefined} state={canClaimResult ? { from: claimDestination } : undefined} to="/register">{canClaimResult ? 'Create Account and Save' : 'Create Account'}</Link>
          </div>
        </section> : null}

        {!result.preview ? <section aria-labelledby="reflection-title" className="reflection-cta">
          <div>
            <p className="eyebrow">Reflect on the Song</p>
            <h2 id="reflection-title">What memories did this song bring back?</h2>
            <p>Share how this song connects to your own Singapore story.</p>
          </div>
          <Link to={reflectionPath}>Write a Reflection</Link>
        </section> : null}

        <nav aria-label="Result actions" className="result-actions">
          <Link
            className="result-action result-action--primary"
            to={result.preview ? `/game/${songId}?difficulty=${result.difficulty}&preview=1` : `/game/${songId}`}
          >
            Play Again
          </Link>

          {!result.preview ? <Link
            className="result-action result-action--secondary"
            to={`/rhythm-game/leaderboard?songId=${encodeURIComponent(songId)}&difficulty=${encodeURIComponent(result.difficulty)}`}
          >
            View Leaderboard
          </Link> : null}

          <Link
            className="result-action result-action--secondary"
            to={result.preview ? `/creator/studio/${songId}` : `/songs/${songId}`}
          >
            {result.preview ? 'Back to Studio' : 'Explore This Song'}
          </Link>

          {!result.preview ? <Link className="result-action result-action--quiet" to="/rhythm-game">Return to Rhythm Games</Link> : null}
        </nav>
      </article>
    </div>
  )
}
