import { API_URL } from './apiConfig'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options)
  const data = response.status === 204 ? null : await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.message || data?.error?.message || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }

  return data
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getReflections(token, songId = '') {
  const query = songId ? `?songId=${encodeURIComponent(songId)}` : ''
  const data = await request(`/reflections${query}`, { headers: authHeaders(token) })
  return data.reflections
}

export async function getModerationReflections(filters, token) {
  const params = new URLSearchParams()
  const values = {
    anonymousOnly: filters.anonymousOnly ? 'true' : '',
    dateFrom: filters.dateFrom,
    limit: filters.limit || 8,
    page: filters.page || 1,
    search: filters.search?.trim(),
    songId: filters.songId,
    status: filters.status,
  }

  Object.entries(values).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) params.set(key, String(value))
  })

  return request(`/reflections/moderation?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export async function moderateReflection(id, values, token) {
  const data = await request(`/reflections/${id}/moderation`, {
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    method: 'PUT',
  })
  return data.reflection
}

export async function getReflectionSongs() {
  const data = await request('/songs')
  return data.songs
}

export async function createReflection(values, token) {
  const data = await request('/reflections', {
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    method: 'POST',
  })
  return data.reflection
}

export async function updateReflection(id, values, token) {
  const data = await request(`/reflections/${id}`, {
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    method: 'PUT',
  })
  return data.reflection
}

export function deleteReflection(id, token) {
  return request(`/reflections/${id}`, {
    headers: authHeaders(token),
    method: 'DELETE',
  })
}
