import { API_URL } from './apiConfig'

const EMPTY_STATS = { usersCount: 0, songsCount: 0, reflectionsCount: 0 }

export async function getCommunityStats() {
  const response = await fetch(`${API_URL}/stats`, { cache: 'no-store' })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Unable to load community statistics.')
  }

  return Object.fromEntries(
    Object.keys(EMPTY_STATS).map((key) => [key, Number.isInteger(data[key]) && data[key] >= 0 ? data[key] : 0]),
  )
}
