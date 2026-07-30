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

export function uploadCreatorResume(id, file, token, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    const body = new FormData()
    body.append('resume', file)
    request.open('POST', `${API_URL}/creator-applications/${encodeURIComponent(id)}/resume`)
    request.setRequestHeader('Authorization', `Bearer ${token}`)
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('load', () => {
      let data = {}
      try { data = JSON.parse(request.responseText || '{}') } catch { /* The shared fallback below handles malformed responses. */ }
      if (request.status >= 200 && request.status < 300) resolve(data.application)
      else {
        const error = new Error(data.message || 'Unable to upload the resume.')
        error.status = request.status
        reject(error)
      }
    })
    request.addEventListener('error', () => reject(new Error('The resume upload was interrupted. Check your connection and try again.')))
    request.addEventListener('abort', () => reject(new Error('The resume upload was cancelled.')))
    request.send(body)
  })
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
