import { getBeatmap } from '../services/beatmapService'

const DIFFICULTIES = ['easy', 'medium', 'hard']

export async function loadBeatmap(song, difficulty, { preview = false, signal, token } = {}) {
  const safeDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : 'easy'
  const beatmap = await getBeatmap(song.id, safeDifficulty, { preview, signal, token })
  return { ...beatmap, artist: song.artist || 'Unknown artist', audioUrl: song.audioUrl || '', songId: song.id, title: song.title || 'Untitled song' }
}

export { DIFFICULTIES }
