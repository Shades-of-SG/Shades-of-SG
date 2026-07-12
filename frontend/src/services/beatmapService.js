import { API_URL } from './apiConfig'
import { normalizeClientBeatmap } from '../utils/beatmapNormalizer'

async function readResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || fallbackMessage)
  return payload
}

export async function getBeatmap(songId, difficulty, { preview = false, signal, token } = {}) {
  const suffix = preview ? '/preview' : ''
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  const response = await fetch(`${API_URL}/songs/${encodeURIComponent(songId)}/beatmaps/${encodeURIComponent(difficulty)}${suffix}`, { headers, signal })
  const payload = await readResponse(response, preview ? 'No draft beatmap is available to preview.' : 'This rhythm game is not available yet.')
  return normalizeClientBeatmap(payload)
}

export async function getBeatmapSummary(songId, { signal, token } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  const response = await fetch(`${API_URL}/songs/${encodeURIComponent(songId)}/beatmaps`, { headers, signal })
  const payload = await readResponse(response, 'Beatmap status could not be loaded.')
  return payload.beatmaps || []
}

export async function generateBeatmap(songId, difficulty, token, mode = 'AI') {
  const response = await fetch(`${API_URL}/songs/${encodeURIComponent(songId)}/beatmaps/generate`, {
    body: JSON.stringify({ difficulty, mode }),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return readResponse(response, 'Beatmap generation failed.')
}

export async function generateAllBeatmaps(songId, token, mode = 'AI') {
  const response = await fetch(`${API_URL}/songs/${encodeURIComponent(songId)}/beatmaps/generate-all`, {
    body: JSON.stringify({ mode }), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, method: 'POST',
  })
  const payload = await readResponse(response, 'Beatmap generation failed.')
  if (response.status === 207) throw new Error(payload.message || 'Some beatmaps could not be generated.')
  return payload
}

async function creatorMutation(songId, difficulty, action, token, options = {}) {
  const response = await fetch(`${API_URL}/songs/${encodeURIComponent(songId)}/beatmaps/${encodeURIComponent(difficulty)}/${action}`, {
    ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  })
  if (response.status === 204) return null
  return readResponse(response, 'Beatmap update failed.')
}

export function saveBeatmapSettings(songId, difficulty, offsetMs, token) {
  return creatorMutation(songId, difficulty, 'settings', token, { body: JSON.stringify({ offsetMs }), headers: { 'Content-Type': 'application/json' }, method: 'PUT' })
}

export function publishBeatmap(songId, difficulty, token) {
  return creatorMutation(songId, difficulty, 'publish', token, { method: 'PUT' })
}

export function unpublishBeatmap(songId, difficulty, token) {
  return creatorMutation(songId, difficulty, 'unpublish', token, { method: 'PUT' })
}

export function deleteBeatmapDraft(songId, difficulty, token) {
  return creatorMutation(songId, difficulty, 'draft', token, { method: 'DELETE' })
}
