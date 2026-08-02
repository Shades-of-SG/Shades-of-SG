import { API_URL } from './apiConfig'

export async function getUserBadges(userId, token) {
  const response = await fetch(`${API_URL}/badges/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to load keepsakes.')
  return (data.badges || [])
    .map((badge) => ({
      description: badge.description || '',
      earnedAt: badge.earnedAt || badge.earned_at,
      id: badge.id || badge.badge_id,
      name: badge.name || badge.badge_name || 'Keepsake',
    }))
    .sort((left, right) => new Date(right.earnedAt || 0) - new Date(left.earnedAt || 0))
}
