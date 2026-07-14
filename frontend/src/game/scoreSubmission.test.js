import { describe, expect, it } from 'vitest'
import { canSubmitScore, createSubmissionGuard } from './scoreSubmission'

const result = { accuracy: 90, difficulty: 'MEDIUM', maxCombo: 8, playedAt: '2026-01-01', processedNotes: 10, score: 9000, songId: 'song', totalNotes: 10 }

describe('score submission guard', () => {
  it('does not allow guests to call the protected save flow', () => {
    expect(canSubmitScore({ result, token: null, user: null })).toBe(false)
    expect(canSubmitScore({ result: { ...result, processedNotes: 1 }, token: 'token', user: { role: 'REGISTERED' } })).toBe(false)
  })
  it('prevents duplicate submissions and permits an explicit retry', () => {
    const guard = createSubmissionGuard()
    expect(guard.begin(result)).toBe(true)
    expect(guard.begin(result)).toBe(false)
    guard.retry(result)
    expect(guard.begin(result)).toBe(true)
  })
})
