import { API_URL } from '../services/apiConfig'

export async function saveScore(result, token) {
  const response = await fetch(`${API_URL}/scores`, {
    body: JSON.stringify({
      accuracy: result.accuracy,
      difficulty: result.difficulty,
      maxCombo: result.maxCombo,
      rank: result.rank,
      score: result.score,
      songId: result.songId,
      totalNotes: result.totalNotes,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    method: 'POST',
  })

  if (!response.ok) {
    const details = await response.json().catch(() => ({}))
    throw new Error(details.message || 'Score could not be saved')
  }

  return response.json()
}

function scoreKey(result) {
  return `${result?.songId}:${result?.playedAt}`
}

function readPendingScores() {
  try {
    const stored = JSON.parse(localStorage.getItem('pendingRhythmScores') || '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

export function queuePendingScore(result) {
  const key = scoreKey(result)
  const unique = readPendingScores().filter((item) => scoreKey(item) !== key)
  localStorage.setItem('pendingRhythmScores', JSON.stringify([result, ...unique].slice(0, 20)))
}

export function removePendingScore(result) {
  const remaining = readPendingScores().filter((item) => scoreKey(item) !== scoreKey(result))
  if (remaining.length) localStorage.setItem('pendingRhythmScores', JSON.stringify(remaining))
  else localStorage.removeItem('pendingRhythmScores')
}
