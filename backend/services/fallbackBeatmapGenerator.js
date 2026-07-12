const { DIFFICULTY_CONFIG } = require('../config/rhythm')
const { normalizeBeatmap } = require('./beatmapValidator')

function hashSeed(value) {
  let hash = 2166136261
  for (const char of String(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619) }
  return hash >>> 0
}

function seededRandom(seed) {
  let state = seed || 1
  return () => { state = (state + 0x6d2b79f5) | 0; let value = Math.imul(state ^ (state >>> 15), 1 | state); value ^= value + Math.imul(value ^ (value >>> 7), 61 | value); return ((value ^ (value >>> 14)) >>> 0) / 4294967296 }
}

function generateFallbackBeatmap({ songId, difficulty, durationMs, bpm }) {
  const normalizedDifficulty = String(difficulty).toUpperCase()
  const config = DIFFICULTY_CONFIG[normalizedDifficulty]
  if (!config) throw new Error('Invalid beatmap difficulty')
  const resolvedBpm = Number.isFinite(Number(bpm)) && Number(bpm) >= 40 ? Number(bpm) : config.bpm
  const random = seededRandom(hashSeed(`${songId}:${normalizedDifficulty}`))
  const beatMs = 60000 / resolvedBpm
  const subdivision = normalizedDifficulty === 'EASY' ? 1 : normalizedDifficulty === 'MEDIUM' ? 0.75 : 0.5
  const stepMs = Math.max(config.minGapMs, Math.round(beatMs * subdivision))
  const notes = []
  const laneAvailableAt = [0, 0, 0, 0]
  let previousLane = -1

  for (let startMs = Math.max(1600, Math.round(beatMs * 3)); startMs < durationMs - 800; startMs += stepMs) {
    let lane = Math.floor(random() * 4)
    if (lane === previousLane) lane = (lane + 1 + Math.floor(random() * 3)) % 4
    for (let attempts = 0; attempts < 4 && laneAvailableAt[lane] > startMs; attempts += 1) lane = (lane + 1) % 4
    if (laneAvailableAt[lane] > startMs) continue
    const makeHold = random() < config.holdChance && startMs < durationMs - config.holdMinMs - 500
    const note = { lane, startMs, type: makeHold ? 'hold' : 'tap' }
    if (makeHold) {
      const range = config.holdMaxMs - config.holdMinMs
      const duration = config.holdMinMs + Math.round((random() * range) / 100) * 100
      note.endMs = Math.min(startMs + duration, durationMs)
      laneAvailableAt[lane] = note.endMs
    } else laneAvailableAt[lane] = startMs + 120
    notes.push(note)
    previousLane = lane

    if (normalizedDifficulty !== 'EASY' && random() < (normalizedDifficulty === 'HARD' ? 0.15 : 0.06)) {
      const chordLane = (lane + 2) % 4
      if (laneAvailableAt[chordLane] <= startMs) { notes.push({ lane: chordLane, startMs, type: 'tap' }); laneAvailableAt[chordLane] = startMs + 120 }
    }
  }
  return normalizeBeatmap({ bpm: resolvedBpm, difficulty: normalizedDifficulty, offsetMs: 0, notes }, { difficulty: normalizedDifficulty, durationMs })
}

module.exports = { generateFallbackBeatmap, hashSeed, seededRandom }
