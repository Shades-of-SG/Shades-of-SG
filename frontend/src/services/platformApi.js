import { API_URL } from './apiConfig'

export async function platformRequest(path, { token, ...options } = {}) {
  const headers = { ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed.')
    error.status = response.status
    throw error
  }
  return data
}

export function jsonOptions(method, body, token) {
  return { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method, token }
}

