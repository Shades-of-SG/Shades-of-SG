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

export function queuePendingScore(result) {
  let existing = []
  try {
    const stored = JSON.parse(localStorage.getItem('pendingRhythmScores') || '[]')
    if (Array.isArray(stored)) existing = stored
  } catch {
    // Replace malformed local data with a clean queue.
  }
  const key = `${result.songId}:${result.playedAt}`
  const unique = existing.filter((item) => `${item?.songId}:${item?.playedAt}` !== key)
  localStorage.setItem('pendingRhythmScores', JSON.stringify([result, ...unique].slice(0, 20)))
}
