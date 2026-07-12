const DIFFICULTY_CONFIG = Object.freeze({
  EASY: { bpm: 96, minGapMs: 600, holdChance: 0.08, holdMinMs: 1000, holdMaxMs: 2000, maxSimultaneous: 2 },
  MEDIUM: { bpm: 112, minGapMs: 350, holdChance: 0.15, holdMinMs: 750, holdMaxMs: 2500, maxSimultaneous: 2 },
  HARD: { bpm: 128, minGapMs: 210, holdChance: 0.22, holdMinMs: 750, holdMaxMs: 3000, maxSimultaneous: 2 },
})

const DIFFICULTIES = Object.freeze(Object.keys(DIFFICULTY_CONFIG))
const MAX_NOTES = 10000

module.exports = { DIFFICULTIES, DIFFICULTY_CONFIG, MAX_NOTES }
