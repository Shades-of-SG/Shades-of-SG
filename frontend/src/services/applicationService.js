import { jsonOptions, platformRequest } from './platformApi'
import { API_URL } from './apiConfig'

export function getMyCreatorApplications(token) {
  return platformRequest('/creator-applications/mine', { token }).then((data) => data.applications)
}

export function submitCreatorApplication(values, token) {
  return platformRequest('/creator-applications', jsonOptions('POST', values, token)).then((data) => data.application)
}

export function saveCreatorApplicationDraft(values, token) {
  return platformRequest('/creator-applications/draft', jsonOptions('PUT', values, token)).then((data) => data.application)
}

export function uploadCreatorResume(id, file, token) {
  const body = new FormData()
  body.append('resume', file)
  return platformRequest(`/creator-applications/${encodeURIComponent(id)}/resume`, { body, method: 'POST', token }).then((data) => data.application)
}

export function removeCreatorResume(id, token) {
  return platformRequest(`/creator-applications/${encodeURIComponent(id)}/resume`, { method: 'DELETE', token })
}

export function submitCreatorApplicationDraft(id, token) {
  return platformRequest(`/creator-applications/${encodeURIComponent(id)}/submit`, { method: 'POST', token })
}

export function withdrawCreatorApplication(id, note, token) {
  return platformRequest(`/creator-applications/${encodeURIComponent(id)}/withdraw`, jsonOptions('POST', { note }, token)).then((data) => data.application)
}

export async function downloadCreatorResume(id, token) {
  const response = await fetch(`${API_URL}/creator-applications/${encodeURIComponent(id)}/resume`, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Unable to download resume.')
  return response.blob()
}
