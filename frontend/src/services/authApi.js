// File: src/services/authApi.js

const API_URL = import.meta.env.VITE_API_URL || '/api'

//trying that new jwt
// Helper: get token from localStorage (or context)
function getAuthHeaders() {
  const token = localStorage.getItem('token') // adjust if you store elsewhere
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Generic fetch wrapper
async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Request failed.')
  return data
}
//end




// Register new user
export async function registerWithEmail(name, email, password, bio, interestTags) {
  const response = await fetch(`${API_URL}/auth/register`, {
    body: JSON.stringify({ name, email, password, bio, interestTags }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Unable to register.');
  return data;
}


// Login existing user
export async function loginWithEmail(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to log in.')
  return data // { user, token }
}

// OTP functions
export async function sendEmailOtp(email) {
  const response = await fetch(`${API_URL}/auth/send-email-otp`, {
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to send OTP.')
  return data
}

export async function verifyEmailOtp(email, otp_code) {
  const response = await fetch(`${API_URL}/auth/verify-email-otp`, {
    body: JSON.stringify({ email, otp_code }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to verify OTP.')
  return data
}

export async function verifyLoginOtp(email, otp_code) {
  const response = await fetch(`${API_URL}/auth/verify-login-otp`, {
    body: JSON.stringify({ email, otp_code }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to verify OTP.')
  return data
}

// Availability checks
export async function checkNameAvailability(name) {
  const response = await fetch(`${API_URL}/auth/check-name/${encodeURIComponent(name)}`)
  return response.json()
}

export async function checkEmailAvailability(email) {
  const response = await fetch(`${API_URL}/auth/check-email/${encodeURIComponent(email)}`)
  return response.json()
}

export async function checkEmailExists(email) {
  const response = await fetch(`${API_URL}/auth/check-email-exists/${encodeURIComponent(email)}`)
  return response.json()
}

// Forget password
export async function resetPassword(email, newPassword) {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, newPassword }),
  })
  return response.json()
}

// Settings: Profile update
export async function updateProfile({ name, email, bio, interestTags }) {
  return apiFetch('/auth/update-profile', {
    method: 'PUT',
    body: JSON.stringify({ name, email, bio, interestTags })
  })
}

// Settings: Change password
export async function changePassword({ oldPassword, newPassword }) {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  })
}

// Settings: Delete account
export async function deleteAccount(userId) {
  return apiFetch(`/auth/delete-account/${userId}`, { //the issue is that the request is sending with the user id
    method: 'DELETE',
  })
}

export async function updateTwoFA(enable2fa) {
  return apiFetch('/auth/update-2fa', {
    method: 'PUT',
    body: JSON.stringify({ enable2fa })
  });
}
