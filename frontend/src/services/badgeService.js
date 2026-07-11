import { API_URL } from './apiConfig'

export async function getUserBadges(userId, token) {
  const response = await fetch(`${API_URL}/badges/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to load keepsakes.')
  return data.badges || []
}
