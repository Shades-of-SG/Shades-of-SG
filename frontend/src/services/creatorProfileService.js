import { jsonOptions, platformRequest } from './platformApi'

export function getMyCreatorProfile(token) {
  return platformRequest('/creators/me/profile', { token }).then((data) => data.profile)
}

export function updateMyCreatorProfile(values, token) {
  return platformRequest('/creators/me/profile', jsonOptions('PATCH', values, token)).then((data) => data.profile)
}

export function uploadCreatorAvatar(file, token) {
  const body = new FormData()
  body.append('avatar', file)
  return platformRequest('/creators/me/profile/avatar', { body, method: 'POST', token }).then((data) => data.profile)
}

export function removeCreatorAvatar(token) {
  return platformRequest('/creators/me/profile/avatar', { method: 'DELETE', token }).then((data) => data.profile)
}

export function getPublicCreatorProfile(creatorId, token = '') {
  return platformRequest(`/creators/${encodeURIComponent(creatorId)}/profile`, { token })
}
