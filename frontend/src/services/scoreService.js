import { API_URL } from './apiConfig'

function normalizeScore(entry) {
  return {
    ...entry,
    createdAt: entry.createdAt || entry.created_at,
    songId: entry.songId || entry.song_id,
  }
}

export async function getMyRhythmProgress(token) {
  const response = await fetch(`${API_URL}/scores/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to load rhythm scores.')
  return {
    bestScores: (data.bestScores || []).map(normalizeScore),
    scores: (data.scores || []).map(normalizeScore),
  }
}

export function getMyScores(token) {
  return getMyRhythmProgress(token).then((data) => data.scores)
}

export async function getMyRhythmSummary(userId, token) {
  const response = await fetch(`${API_URL}/scores/user/${encodeURIComponent(userId)}/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to load rhythm progress.')
  return data.summary
}
