import { API_URL } from './apiConfig'

async function publicRequest(path, token) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to load published songs.')
  return data
}

export function getPublishedSongs(filters = {}, token) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','))
    } else if (value?.trim()) {
      params.set(key, value.trim())
    }
  })
  const query = params.toString()
  return publicRequest(`/songs${query ? `?${query}` : ''}`, token).then((data) => data.songs)
}

export function getPublishedSong(songId) {
  return publicRequest(`/songs/${encodeURIComponent(songId)}`).then((data) => data.song)
}
