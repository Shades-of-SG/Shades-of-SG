const STORAGE_KEY = 'shades-of-sg:pending-rhythm-score-claim'
export const PENDING_SCORE_CLAIM_TTL_MS = 45 * 60 * 1000

function makeClaimId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16)
    return (character === 'x' ? value : (value & 0x3) | 0x8).toString(16)
  })
}

function finiteNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function validClaim(value) {
  return Boolean(
    value
    && typeof value.claimId === 'string'
    && typeof value.songId === 'string'
    && typeof value.difficulty === 'string'
    && typeof value.playedAt === 'string'
    && Number.isFinite(value.expiresAt)
    && finiteNumber(value.score) !== null
    && finiteNumber(value.totalNotes) !== null,
  )
}

export function readPendingScoreClaim(now = Date.now()) {
  try {
    const pending = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    if (!validClaim(pending) || pending.expiresAt <= now) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return pending
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function storePendingScoreClaim(result, now = Date.now()) {
  if (!result || result.preview) return null
  const existing = readPendingScoreClaim(now)
  if (existing?.songId === result.songId && existing?.playedAt === result.playedAt) return existing

  const pending = {
    accuracy: finiteNumber(result.accuracy),
    badHits: finiteNumber(result.badHits),
    claimId: makeClaimId(),
    difficulty: String(result.difficulty || ''),
    earlyReleases: finiteNumber(result.earlyReleases),
    expiresAt: now + PENDING_SCORE_CLAIM_TTL_MS,
    goodHits: finiteNumber(result.goodHits),
    greatHits: finiteNumber(result.greatHits),
    holdCompletions: finiteNumber(result.holdCompletions),
    maxCombo: finiteNumber(result.maxCombo),
    misses: finiteNumber(result.misses),
    perfectHits: finiteNumber(result.perfectHits),
    playedAt: String(result.playedAt || new Date(now).toISOString()),
    rank: String(result.rank || ''),
    score: finiteNumber(result.score),
    songId: String(result.songId || ''),
    totalNotes: finiteNumber(result.totalNotes),
  }

  if (!validClaim(pending)) return null
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
    return pending
  } catch {
    return null
  }
}

export function clearPendingScoreClaim(claimId) {
  const pending = readPendingScoreClaim()
  if (!pending || pending.claimId === claimId) sessionStorage.removeItem(STORAGE_KEY)
}
