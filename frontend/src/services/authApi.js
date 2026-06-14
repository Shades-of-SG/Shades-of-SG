const API_URL = import.meta.env.VITE_API_URL || '/api'

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
