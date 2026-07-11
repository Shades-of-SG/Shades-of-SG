import { API_URL } from './apiConfig'

export async function getMyScores(token) {
  const response = await fetch(`${API_URL}/scores/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to load rhythm scores.')
  return data.scores || []
}
