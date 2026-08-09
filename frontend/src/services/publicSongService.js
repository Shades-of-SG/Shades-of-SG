import { API_URL } from './apiConfig'

async function publicRequest(path, token, signal) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to load published songs.')
  return data
}

export function getPublishedSongs(filters = {}, token, { signal } = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','))
    } else if (value !== '' && value !== undefined && value !== null) {
      params.set(key, typeof value === 'string' ? value.trim() : String(value))
    }
  })
  const query = params.toString()
  return publicRequest(`/songs${query ? `?${query}` : ''}`, token, signal).then((data) => ({
    facets: data.facets,
    items: data.items || data.songs || [],
    pagination: data.pagination || { page: 1, limit: (data.items || data.songs || []).length, totalItems: (data.items || data.songs || []).length, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  }))
}

export function getPublishedSong(songId) {
  return publicRequest(`/songs/${encodeURIComponent(songId)}`).then((data) => data.song)
}
