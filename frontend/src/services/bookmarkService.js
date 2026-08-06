import { jsonOptions, platformRequest } from './platformApi'

export function toggleBookmark(songId, bookmarked, token) {
  return platformRequest(`/songs/${encodeURIComponent(songId)}/bookmark`, jsonOptions('PUT', { bookmarked }, token))
}
