import { API_URL } from './apiConfig'

async function authRequest(path, options = {}) {
  const response = await fetch(`${API_URL}/auth${path}`, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'Unable to complete this request.')
    error.code = data.code
    error.status = response.status
    error.retryAfter = Number(response.headers?.get?.('Retry-After') || 0)
    throw error
  }
  return data
}

const jsonRequest = (method, body, token = '') => ({
  body: JSON.stringify(body),
  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
  method,
})

export const getAuthConfig = () => authRequest('/config')
export const loginWithEmail = (email, password) => authRequest('/login', jsonRequest('POST', { email, password }))
export const getOauthChallenge = (provider) => authRequest('/oauth/challenge', jsonRequest('POST', { provider }))
export const loginWithGoogle = (credential, nonce) => authRequest('/oauth/google', jsonRequest('POST', { credential, nonce }))
export const loginWithApple = (values) => authRequest('/oauth/apple', jsonRequest('POST', values))
export const registerAccount = (values) => authRequest('/register', jsonRequest('POST', values))
export const verifyRegistrationOtp = (email, code) => authRequest('/verify-email', jsonRequest('POST', { code, email }))
export const resendRegistrationOtp = (email) => authRequest('/resend-verification', jsonRequest('POST', { email }))
export const requestPasswordReset = (email) => authRequest('/password-reset/request', jsonRequest('POST', { email }))
export const verifyPasswordResetOtp = (email, code) => authRequest('/password-reset/verify', jsonRequest('POST', { code, email }))
export const completePasswordReset = (resetToken, password) => authRequest('/password-reset/complete', jsonRequest('POST', { password, resetToken }))
export const getCurrentUser = (token) => authRequest('/me', { headers: { Authorization: `Bearer ${token}` } }).then((data) => data.user)

export async function updateProfile(values, token) {
  const data = await authRequest('/profile', jsonRequest('PUT', values, token))
  return data.user
}
