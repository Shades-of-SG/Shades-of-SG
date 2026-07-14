export const RHYTHM_CONFIG = Object.freeze({
  easy: { approachDurationMs: 2200 },
  medium: { approachDurationMs: 1800 },
  hard: { approachDurationMs: 1400 },
})

export const JUDGEMENT_WINDOWS = Object.freeze({ PERFECT: 45, GREAT: 90, GOOD: 140, BAD: 190 })

export function getTimingJudgement(errorMs) {
  const absolute = Math.abs(Number(errorMs))
  if (absolute <= JUDGEMENT_WINDOWS.PERFECT) return 'PERFECT'
  if (absolute <= JUDGEMENT_WINDOWS.GREAT) return 'GREAT'
  if (absolute <= JUDGEMENT_WINDOWS.GOOD) return 'GOOD'
  if (absolute <= JUDGEMENT_WINDOWS.BAD) return 'BAD'
  return 'MISS'
}

export function getNoteProgress(startMs, songTimeMs, difficulty = 'medium', noteSpeed = 1) {
  const baseApproachMs = RHYTHM_CONFIG[difficulty]?.approachDurationMs || RHYTHM_CONFIG.medium.approachDurationMs
  const safeSpeed = Math.max(0.75, Math.min(1.5, Number(noteSpeed) || 1))
  const approachDurationMs = baseApproachMs / safeSpeed
  return 1 - (startMs - songTimeMs) / approachDurationMs
}

export function isMissed(startMs, songTimeMs) {
  return songTimeMs - startMs > JUDGEMENT_WINDOWS.BAD
}

export function getSongTimeMs(audioTimeSeconds, beatmapOffsetMs = 0, calibrationOffsetMs = 0) {
  const audioMs = Number(audioTimeSeconds) * 1000
  if (!Number.isFinite(audioMs)) return 0
  return audioMs + Number(beatmapOffsetMs || 0) + Number(calibrationOffsetMs || 0)
}
