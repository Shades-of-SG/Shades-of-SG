import { beforeEach, describe, expect, it } from 'vitest'
import { queuePendingScore } from './scoresApi'

describe('pending rhythm score queue', () => {
  beforeEach(() => localStorage.clear())

  it('deduplicates retries for the same completed run', () => {
    const result = { playedAt: '2026-07-12T12:00:00.000Z', songId: 'song-1' }
    queuePendingScore(result)
    queuePendingScore(result)
    expect(JSON.parse(localStorage.getItem('pendingRhythmScores'))).toEqual([result])
  })

  it('recovers from malformed local queue data', () => {
    localStorage.setItem('pendingRhythmScores', '{bad json')
    queuePendingScore({ playedAt: 'now', songId: 'song-2' })
    expect(JSON.parse(localStorage.getItem('pendingRhythmScores'))).toHaveLength(1)
  })
})
