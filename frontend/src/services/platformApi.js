import { API_URL } from './apiConfig'
import { notifyAuthExpired } from '../utils/authEvents'

const REQUEST_TIMEOUT_MS = 15_000

export async function platformRequest(path, { token, ...options } = {}) {
  const headers = { ...(options.headers || {}) }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // A request that never resolves (an un-mocked endpoint in tests, a hung backend)
  // should fail fast with a clear error instead of leaving the page's loading
  // state — and anything awaiting it — stuck indefinitely.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.', { cause: error })
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }

  const data =
    response.status === 204
      ? null
      : await response.json().catch(() => ({}))

  if (response.status === 401 && token) {
    notifyAuthExpired()
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || 'Request failed.'
    )

    error.code = data?.code
    error.reason = data?.reason
    error.status = response.status

    throw error
  }

  return data
}

export function jsonOptions(method, body, token) {
  return {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method,
    token,
  }
}