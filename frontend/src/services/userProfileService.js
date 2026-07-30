import { jsonOptions, platformRequest } from './platformApi'

export function getMyUserProfile(token) {
  return platformRequest('/users/me/profile', { token })
}

export function updateMyUserProfile(values, token) {
  return platformRequest('/users/me/profile', jsonOptions('PATCH', values, token))
}

export function uploadUserAvatar(file, token) {
  const body = new FormData()
  body.append('avatar', file)
  return platformRequest('/users/me/profile/avatar', { body, method: 'POST', token })
}

export function removeUserAvatar(token) {
  return platformRequest('/users/me/profile/avatar', { method: 'DELETE', token })
}

export function getPublicUserProfile(userId, token = '') {
  return platformRequest(`/users/${encodeURIComponent(userId)}/profile`, { token })
}
