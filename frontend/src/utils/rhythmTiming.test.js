import { describe, expect, it } from 'vitest'
import { getNoteProgress, getSongTimeMs, getTimingJudgement, isMissed } from './rhythmTiming'

describe('rhythm timing', () => {
  it.each([[0, 'PERFECT'], [70, 'GREAT'], [-120, 'GOOD'], [175, 'BAD'], [200, 'MISS']])('judges %sms as %s', (error, expected) => expect(getTimingJudgement(error)).toBe(expected))
  it('uses song time for note position and missed-note processing', () => {
    expect(getNoteProgress(2000, 200, 'medium')).toBe(0)
    expect(getNoteProgress(2000, 2000, 'medium')).toBe(1)
    expect(isMissed(1000, 1191)).toBe(true)
  })
  it('derives the authoritative game clock from audio plus chart and calibration offsets', () => {
    expect(getSongTimeMs(1.5, 100, -25)).toBe(1575)
    expect(getSongTimeMs(Number.NaN, 100, 50)).toBe(0)
  })
  it('changes only visual approach progress when note speed changes', () => {
    expect(getNoteProgress(2000, 200, 'medium', 1.5)).toBeLessThan(getNoteProgress(2000, 200, 'medium', 1))
    expect(getTimingJudgement(70)).toBe('GREAT')
  })
})
