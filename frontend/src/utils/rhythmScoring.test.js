import { describe, expect, it } from 'vitest'
import { applyJudgement, calculateWeightedAccuracy, completeHold, createStats, scoreForJudgement } from './rhythmScoring'

describe('rhythm scoring', () => {
  it('scores tap judgements and caps the combo multiplier', () => {
    expect(scoreForJudgement('PERFECT', 1000)).toBe(1500)
    const stats = applyJudgement(createStats(1), 'GREAT')
    expect(stats).toMatchObject({ combo: 1, processed: 1, score: 750 })
  })
  it('calculates bounded weighted accuracy', () => {
    expect(calculateWeightedAccuracy(750, 1000)).toBe(75)
    expect(calculateWeightedAccuracy(2000, 1000)).toBe(100)
  })
  it('requires sustain and release for a successful hold', () => {
    const success = completeHold(createStats(1), { startJudgement: 'PERFECT', releaseJudgement: 'GREAT', sustainedRatio: 1 })
    const early = completeHold(createStats(1), { startJudgement: 'PERFECT', releaseJudgement: 'MISS', sustainedRatio: 0.4 })
    expect(success.holdCompletions).toBe(1)
    expect(early).toMatchObject({ combo: 0, earlyReleases: 1, holdCompletions: 0 })
    expect(early.score).toBeLessThan(success.score)
  })
})
