const { DIFFICULTIES, DIFFICULTY_CONFIG, MAX_NOTES } = require('../config/rhythm')

function validationError(message) {
  const error = new Error(message)
  error.name = 'BeatmapValidationError'
  return error
}

function normalizeBeatmap(input, { difficulty, durationMs }) {
  const normalizedDifficulty = String(difficulty || input?.difficulty || '').toUpperCase()
  if (!DIFFICULTIES.includes(normalizedDifficulty)) throw validationError('Invalid beatmap difficulty')
  if (!Number.isInteger(durationMs) || durationMs < 1000) throw validationError('A valid song duration is required')
  if (!input || !Array.isArray(input.notes)) throw validationError('Beatmap notes must be an array')
  if (input.notes.length === 0 || input.notes.length > MAX_NOTES) throw validationError(`Beatmap must contain 1 to ${MAX_NOTES} notes`)
  if (input.difficulty && String(input.difficulty).toUpperCase() !== normalizedDifficulty) {
    throw validationError('Beatmap difficulty does not match the requested difficulty')
  }

  const config = DIFFICULTY_CONFIG[normalizedDifficulty]
  const ids = new Set()
  const notes = input.notes.map((raw, index) => {
    const lane = Number(raw.lane)
    const startMs = Math.round(Number(raw.startMs))
    const type = String(raw.type || 'tap').toLowerCase()
    if (!Number.isInteger(lane) || lane < 0 || lane > 3) throw validationError(`Note ${index + 1} has an invalid lane`)
    if (!Number.isFinite(startMs) || startMs < 0 || startMs >= durationMs) throw validationError(`Note ${index + 1} has an invalid timestamp`)
    if (!['tap', 'hold'].includes(type)) throw validationError(`Note ${index + 1} has an invalid type`)
    const id = String(raw.id || `note-${String(index + 1).padStart(4, '0')}`)
    if (ids.has(id)) throw validationError(`Duplicate note id: ${id}`)
    ids.add(id)
    const note = { id, lane, startMs, type }
    if (type === 'hold') {
      const endMs = Math.round(Number(raw.endMs))
      const duration = endMs - startMs
      if (!Number.isFinite(endMs) || endMs > durationMs || duration < config.holdMinMs || duration > config.holdMaxMs) {
        throw validationError(`Note ${index + 1} has an invalid hold duration`)
      }
      note.endMs = endMs
      note.durationMs = duration
    }
    return note
  }).sort((a, b) => a.startMs - b.startMs || a.lane - b.lane)

  const laneEnds = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
  const timestamps = new Map()
  let previousTimestamp = Number.NEGATIVE_INFINITY
  for (const note of notes) {
    if (note.startMs !== previousTimestamp && note.startMs - previousTimestamp < config.minGapMs) {
      throw validationError(`Notes are too close together for ${normalizedDifficulty}`)
    }
    if (note.startMs < laneEnds[note.lane]) throw validationError(`Overlapping notes in lane ${note.lane}`)
    laneEnds[note.lane] = note.type === 'hold' ? note.endMs : note.startMs + Math.min(config.minGapMs, 120)
    const simultaneous = (timestamps.get(note.startMs) || 0) + 1
    if (simultaneous > config.maxSimultaneous) throw validationError('Too many simultaneous notes')
    timestamps.set(note.startMs, simultaneous)
    previousTimestamp = note.startMs
  }

  const bpm = input.bpm === null || input.bpm === undefined ? null : Number(input.bpm)
  if (bpm !== null && (!Number.isFinite(bpm) || bpm < 40 || bpm > 300)) throw validationError('Beatmap BPM must be between 40 and 300')
  const offsetMs = input.offsetMs === null || input.offsetMs === undefined ? 0 : Math.round(Number(input.offsetMs))
  if (!Number.isFinite(offsetMs) || Math.abs(offsetMs) > Math.min(durationMs, 5000)) throw validationError('Beatmap offset is invalid')

  return {
    difficulty: normalizedDifficulty,
    bpm,
    offsetMs,
    notes,
  }
}

function parseAndNormalizeBeatmap(raw, options) {
  let parsed = raw
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw) } catch { throw validationError('Malformed beatmap JSON') }
  }
  return normalizeBeatmap(parsed, options)
}

module.exports = { normalizeBeatmap, parseAndNormalizeBeatmap }
