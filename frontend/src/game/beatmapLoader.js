const DIFFICULTIES = ['easy', 'medium', 'hard']

function createProceduralNotes(durationSecs, difficulty) {
  if (!Number.isFinite(durationSecs) || durationSecs < 5) return []
  const spacing = { easy: 1.2, medium: 0.85, hard: 0.58 }[difficulty]
  const notes = []
  for (let time = 2, index = 0; time < durationSecs - 1; time += spacing, index += 1) {
    notes.push({ id: `${time.toFixed(2)}-${index}`, lane: index % 4, status: 'pending', time: Number(time.toFixed(2)) })
  }
  return notes
}

export async function loadBeatmap(song, difficulty) {
  const safeDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : 'easy'
  const notes = createProceduralNotes(Number(song.durationSecs), safeDifficulty)
  if (notes.length === 0) throw new Error('This published Song does not have a usable duration for rhythm play.')
  return {
    artist: song.artist || 'Unknown artist', audioUrl: song.audioUrl || '',
    difficulty: safeDifficulty, notes, songId: song.id, title: song.title || 'Untitled song',
  }
}

export { DIFFICULTIES }
