export function normalizeClientBeatmap(payload) {
  const source = payload?.beatmap || payload
  if (!source || !Array.isArray(source.notes)) throw new Error('Beatmap response is invalid')
  const difficulty = String(source.difficulty || '').toLowerCase()
  const durationMs = Math.round(Number(source.durationMs))
  if (!['easy', 'medium', 'hard'].includes(difficulty) || !Number.isInteger(durationMs) || durationMs < 1000) throw new Error('Beatmap metadata is invalid')
  const ids = new Set()
  const notes = source.notes.map((raw, index) => {
    const id = String(raw.id || `note-${index + 1}`)
    const lane = Number(raw.lane)
    const startMs = Math.round(Number(raw.startMs))
    const type = raw.type === 'hold' ? 'hold' : raw.type === 'tap' ? 'tap' : null
    if (ids.has(id) || !Number.isInteger(lane) || lane < 0 || lane > 3 || !Number.isFinite(startMs) || startMs < 0 || startMs >= durationMs || !type) throw new Error('Beatmap contains invalid notes')
    ids.add(id)
    const note = { id, lane, startMs, type, status: 'pending' }
    if (type === 'hold') {
      const endMs = Math.round(Number(raw.endMs))
      if (!Number.isFinite(endMs) || endMs <= startMs || endMs > durationMs) throw new Error('Beatmap contains an invalid hold note')
      note.endMs = endMs
      note.durationMs = endMs - startMs
    }
    return note
  }).sort((a, b) => a.startMs - b.startMs || a.lane - b.lane)
  if (notes.length === 0) throw new Error('Beatmap contains no playable notes')
  return { ...source, difficulty, durationMs, notes }
}
