const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options)
  const data = response.status === 204 ? null : await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.message || data?.error?.message || 'Something went wrong. Please try again.')
  }

  return data
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getReflections(token) {
  const data = await request('/reflections', { headers: authHeaders(token) })
  return data.reflections
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
