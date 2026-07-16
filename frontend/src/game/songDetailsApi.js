import { API_URL } from '../services/apiConfig'

export async function fetchSongDetails(songId, { preview = false, signal, token } = {}) {
  const encodedSongId = encodeURIComponent(songId)
  const path = preview ? `/songs/creator/${encodedSongId}` : `/songs/${encodedSongId}`
  const headers = preview && token ? { Authorization: `Bearer ${token}` } : undefined
  const response = await fetch(`${API_URL}${path}`, { headers, signal })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.message || 'Song details could not be loaded')
  }

  const payload = await response.json()
  const song = payload.song || payload

  return {
    id: song.id || songId,
    artist: song.artist || '',
    description: song.description || '',
    audioUrl: song.audioUrl || '',
    coverImageUrl: song.coverImageUrl || '',
    durationSecs: song.durationSecs || 0,
    languages: song.languages || [],
    theme: song.theme || '',
    thumbnailUrl:
      song.thumbnail_url ||
      song.thumbnailUrl ||
      song.cover_url ||
      song.coverUrl ||
      song.image_url ||
      song.imageUrl ||
      '',
    title: song.title || 'Untitled song',
    videoUrl: song.video_url || song.videoUrl || '',
  }
}
