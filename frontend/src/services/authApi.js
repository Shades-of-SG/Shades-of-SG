import { API_URL } from './apiConfig'

export async function loginWithEmail(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    body: JSON.stringify({ email, password }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Unable to log in.')
  }

  return data
}

export async function registerAccount(name, email, password) {
  const response = await fetch(`${API_URL}/auth/register`, {
    body: JSON.stringify({ name, email, password }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to create account.')
  return data
}
