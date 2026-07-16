import { API_URL } from './apiConfig'

async function request(path, { token, ...options } = {}) {
  const headers = { ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || data.error?.message || 'Song request failed.')
    error.status = response.status
    error.details = data
    throw error
  }
  return data
}

export function getCreatorSong(songId, token) {
  return request(`/songs/creator/${encodeURIComponent(songId)}`, { token }).then((data) => data.song)
}

export function createDraft(values, token, audioFile) {
  if (audioFile) {
    const body = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      body.append(key, Array.isArray(value) ? JSON.stringify(value) : value ?? '')
    })
    body.set('languages', JSON.stringify(values.languages || []))
    body.set('otherLanguages', JSON.stringify(values.otherLanguages || []))
    body.set('moodTags', JSON.stringify(values.moodTags || []))
    body.append('audioFile', audioFile)
    return request('/songs', { body, method: 'POST', token }).then((data) => data.song || data.data)
  }
  return request('/songs', {
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST', token,
  }).then((data) => data.song || data.data)
}

export function updateDraft(songId, values, token) {
  return request(`/songs/${encodeURIComponent(songId)}/metadata`, {
    body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' }, method: 'PUT', token,
  }).then((data) => data.song)
}

export function uploadCover(songId, file, token) {
  const body = new FormData()
  body.append('coverImage', file)
  return request(`/songs/${encodeURIComponent(songId)}/cover`, { body, method: 'POST', token })
}

export function uploadAudio(songId, file, token) {
  const body = new FormData()
  body.append('audioFile', file)
  return request(`/songs/${encodeURIComponent(songId)}/audio`, { body, method: 'POST', token }).then((data) => data.song)
}

export function uploadVideo(songId, file, token) {
  const body = new FormData()
  body.append('videoFile', file)
  return request(`/songs/${encodeURIComponent(songId)}/video`, { body, method: 'POST', token }).then((data) => data.song)
}

export function getPublishReadiness(songId, token) {
  return request(`/songs/${encodeURIComponent(songId)}/readiness`, { token })
}

export function publishSong(songId, token) {
  return request(`/songs/${encodeURIComponent(songId)}/publish`, { method: 'PUT', token }).then((data) => data.song)
}

export function startGeneration(songId, token) {
  return request('/generation/start', {
    body: JSON.stringify({ songId }), headers: { 'Content-Type': 'application/json' }, method: 'POST', token,
  }).then((data) => data.data)
}

export function getCreatorSongs(token, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request(`/songs/creator${query}`, { token }).then((data) => data.songs)
}

export function getGenerationJobs(token) {
  return request('/generation', { token }).then((data) => data.data)
}

export function getGenerationJob(jobId, token) {
  return request(`/generation/${encodeURIComponent(jobId)}/status`, { token }).then((data) => data.data)
}

export function unpublishSong(songId, token) {
  return request(`/songs/${encodeURIComponent(songId)}/unpublish`, { method: 'PUT', token }).then((data) => data.song)
}

export function archiveSong(songId, token) {
  return request(`/songs/${encodeURIComponent(songId)}/archive`, { method: 'PUT', token }).then((data) => data.song)
}

export function deleteSong(songId, token) {
  return request(`/songs/${encodeURIComponent(songId)}`, { method: 'DELETE', token })
}

export function getCreatorDashboardSummary(token) {
  return request('/songs/creator/dashboard/summary', { token })
}
