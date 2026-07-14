export const JUDGEMENT_POINTS = Object.freeze({ PERFECT: 1000, GREAT: 750, GOOD: 450, BAD: 150, MISS: 0 })

export function comboMultiplier(combo) {
  return Math.min(1 + Math.floor(Math.max(combo, 0) / 10) * 0.1, 1.5)
}

export function scoreForJudgement(judgement, combo = 0, scale = 1) {
  return Math.round((JUDGEMENT_POINTS[judgement] || 0) * comboMultiplier(combo) * scale)
}

export function calculateWeightedAccuracy(earnedPoints, maximumPoints) {
  if (!Number.isFinite(earnedPoints) || !Number.isFinite(maximumPoints) || maximumPoints <= 0) return 0
  return Math.max(0, Math.min(100, Number(((earnedPoints / maximumPoints) * 100).toFixed(2))))
}

export function createStats(totalNotes = 0) {
  return { score: 0, combo: 0, maxCombo: 0, processed: 0, earnedAccuracyPoints: 0, maximumAccuracyPoints: totalNotes * 1000, judgements: { PERFECT: 0, GREAT: 0, GOOD: 0, BAD: 0, MISS: 0 }, holdCompletions: 0, earlyReleases: 0 }
}

export function applyJudgement(stats, judgement, { accuracyScale = 1, scoreScale = 1, completesNote = true } = {}) {
  const successful = judgement !== 'MISS'
  const combo = successful ? stats.combo + (completesNote ? 1 : 0) : 0
  return {
    ...stats,
    score: stats.score + scoreForJudgement(judgement, combo, scoreScale),
    combo,
    maxCombo: Math.max(stats.maxCombo, combo),
    processed: stats.processed + (completesNote ? 1 : 0),
    earnedAccuracyPoints: stats.earnedAccuracyPoints + (JUDGEMENT_POINTS[judgement] || 0) * accuracyScale,
    judgements: { ...stats.judgements, [judgement]: stats.judgements[judgement] + (completesNote ? 1 : 0) },
  }
}

export function completeHold(stats, { startJudgement, releaseJudgement, sustainedRatio }) {
  const sustain = Math.max(0, Math.min(1, sustainedRatio))
  const startPoints = (JUDGEMENT_POINTS[startJudgement] || 0) * 0.4
  const releasePoints = (JUDGEMENT_POINTS[releaseJudgement] || 0) * 0.3
  const earned = startPoints + releasePoints + 300 * sustain
  const successful = releaseJudgement !== 'MISS' && sustain >= 0.85
  const combo = successful ? stats.combo + 1 : 0
  return {
    ...stats,
    score: stats.score + Math.round(earned * comboMultiplier(combo)),
    combo,
    maxCombo: Math.max(stats.maxCombo, combo),
    processed: stats.processed + 1,
    earnedAccuracyPoints: stats.earnedAccuracyPoints + earned,
    judgements: { ...stats.judgements, [successful ? startJudgement : 'MISS']: stats.judgements[successful ? startJudgement : 'MISS'] + 1 },
    holdCompletions: stats.holdCompletions + (successful ? 1 : 0),
    earlyReleases: stats.earlyReleases + (successful ? 0 : 1),
  }
}
