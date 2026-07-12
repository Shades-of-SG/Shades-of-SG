import { API_URL } from './apiConfig'

async function publicRequest(path) {
  const response = await fetch(`${API_URL}${path}`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to load published songs.')
  return data
}

export function getPublishedSongs(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value?.trim()) params.set(key, value.trim())
  })
  const query = params.toString()
  return publicRequest(`/songs${query ? `?${query}` : ''}`).then((data) => data.songs)
}

export function getPublishedSong(songId) {
  return publicRequest(`/songs/${encodeURIComponent(songId)}`).then((data) => data.song)
}
