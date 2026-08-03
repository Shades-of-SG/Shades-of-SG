import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { claimGuestScore } from '../game/scoresApi'
import { clearPendingScoreClaim, readPendingScoreClaim } from '../services/pendingScoreClaim'
import { clearScoreClaimReturn, isNewAccountScoreClaim } from '../services/safeReturnPath'

export default function RhythmScoreClaim() {
  const { authLoading, refreshProfile, token } = useAuth()
  const [pending] = useState(() => readPendingScoreClaim())
  const [newAccountClaim] = useState(() => isNewAccountScoreClaim())
  const [status, setStatus] = useState(pending ? 'claiming' : 'unavailable')
  const requestStarted = useRef(false)

  useEffect(() => {
    if (authLoading || !pending || !token || requestStarted.current) return
    requestStarted.current = true
    claimGuestScore(pending, token)
      .then(() => {
        clearPendingScoreClaim(pending.claimId)
        clearScoreClaimReturn()
        setStatus('saved')
        refreshProfile().catch(() => {})
      })
      .catch(() => setStatus('error'))
  }, [authLoading, pending, refreshProfile, token])

  useEffect(() => {
    if (!authLoading && !pending) clearScoreClaimReturn()
  }, [authLoading, pending])

  async function retryClaim() {
    if (!pending || !token || requestStarted.current) return
    requestStarted.current = true
    setStatus('claiming')
    try {
      await claimGuestScore(pending, token)
      clearPendingScoreClaim(pending.claimId)
      clearScoreClaimReturn()
      setStatus('saved')
      refreshProfile().catch(() => {})
    } catch {
      setStatus('error')
    }
  }

  return <div className="results-page rhythm-claim-page">
    <section aria-labelledby="claim-score-title" className="results-card rhythm-claim-card">
      <p className="eyebrow">Guest score</p>
      {authLoading ? <><h1 id="claim-score-title">Restoring your account&hellip;</h1><p>Please keep this page open for a moment.</p></> : null}
      {!authLoading && status === 'claiming' ? <><h1 id="claim-score-title">Saving your score&hellip;</h1><p>Please keep this page open for a moment.</p></> : null}
      {!authLoading && status === 'saved' ? <><h1 id="claim-score-title">Score saved</h1><p role="status">{newAccountClaim ? 'Your score has been saved to your new account.' : 'Your score has been saved to your account.'}</p></> : null}
      {status === 'error' ? <><h1 id="claim-score-title">We couldn&rsquo;t save your score</h1><p>Your pending result is still available in this browser session. Try again while it is active.</p><button className="result-action result-action--primary" onClick={() => { requestStarted.current = false; retryClaim() }} type="button">Retry saving</button></> : null}
      {status === 'unavailable' ? <><h1 id="claim-score-title">This guest result is no longer available</h1><p>Guest score claims expire after a short time and are kept only in the browser session where you played.</p></> : null}
      {!authLoading && status !== 'claiming' ? <nav aria-label="Claim score actions" className="result-actions result-actions--fallback">
        {status === 'saved' && pending ? <Link className="result-action result-action--primary" state={{ result: pending }} to={`/game/${encodeURIComponent(pending.songId)}/results`}>View Saved Result</Link> : <Link className="result-action result-action--primary" to="/profile">View Profile</Link>}
        <Link className="result-action result-action--secondary" to="/rhythm-game">Rhythm Games</Link>
      </nav> : null}
    </section>
  </div>
}
