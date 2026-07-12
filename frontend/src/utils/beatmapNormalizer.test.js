import { describe, expect, it } from 'vitest'
import { normalizeClientBeatmap } from './beatmapNormalizer'

const beatmap = {
  beatmap: {
    difficulty: 'MEDIUM',
    durationMs: 10000,
    notes: [
      { id: 'hold-1', lane: 2, startMs: 2000, endMs: 3500, type: 'hold' },
      { id: 'tap-1', lane: 0, startMs: 1000, type: 'tap' },
    ],
  },
}

describe('client beatmap normalization', () => {
  it('normalizes, validates, and sorts tap and hold notes', () => {
    const result = normalizeClientBeatmap(beatmap)
    expect(result.difficulty).toBe('medium')
    expect(result.notes[0]).toMatchObject({ id: 'tap-1', startMs: 1000, status: 'pending' })
    expect(result.notes[1]).toMatchObject({ durationMs: 1500, endMs: 3500, type: 'hold' })
  })

  it.each([
    [{ ...beatmap.beatmap, notes: [] }],
    [{ ...beatmap.beatmap, notes: [{ lane: 4, startMs: 1000, type: 'tap' }] }],
    [{ ...beatmap.beatmap, notes: [{ lane: 0, startMs: 1000, endMs: 900, type: 'hold' }] }],
    [{ ...beatmap.beatmap, notes: [{ id: 'same', lane: 0, startMs: 1000, type: 'tap' }, { id: 'same', lane: 1, startMs: 2000, type: 'tap' }] }],
  ])('rejects an unsafe server beatmap', (unsafeBeatmap) => {
    expect(() => normalizeClientBeatmap(unsafeBeatmap)).toThrow(/beatmap/i)
  })
})
