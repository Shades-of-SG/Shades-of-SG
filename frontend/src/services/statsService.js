import { API_URL } from './apiConfig'

export async function getCommunityStats() {
  const response = await fetch(`${API_URL}/stats`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to load community statistics.')
  return data
}

export async function getMyStats(token) {
  const response = await fetch(`${API_URL}/stats/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to load your statistics.')
  return data
}
