import { jsonOptions, platformRequest } from './platformApi'

export function reportSong(songId, { reason, details }, token) {
  return platformRequest(`/songs/${encodeURIComponent(songId)}/report`, jsonOptions('POST', { details, reason }, token))
}
