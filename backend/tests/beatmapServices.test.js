const { normalizeBeatmap, parseAndNormalizeBeatmap } = require('../services/beatmapValidator')
const { generateFallbackBeatmap } = require('../services/fallbackBeatmapGenerator')
const { generateBeatmap } = require('../services/beatmapGenerator')

const options = { difficulty: 'MEDIUM', durationMs: 10000 }

test('normalizes a valid hold note with integer milliseconds', () => {
  const result = normalizeBeatmap({ notes: [{ lane: 2, startMs: 1000, endMs: 2200, type: 'hold' }] }, options)
  expect(result.notes[0]).toMatchObject({ durationMs: 1200, endMs: 2200, lane: 2, type: 'hold' })
})

test.each([
  [[{ lane: 4, startMs: 1000, type: 'tap' }], 'invalid lane'],
  [[{ lane: 0, startMs: -1, type: 'tap' }], 'invalid timestamp'],
  [[{ lane: 0, startMs: 10001, type: 'tap' }], 'invalid timestamp'],
  [[{ lane: 0, startMs: 1000, endMs: 1200, type: 'hold' }], 'invalid hold duration'],
  [[{ lane: 0, startMs: 1000, endMs: 2200, type: 'hold' }, { lane: 0, startMs: 1500, type: 'tap' }], 'Overlapping'],
])('rejects unsafe note data', (notes, message) => {
  expect(() => normalizeBeatmap({ notes }, options)).toThrow(message)
})

test('rejects malformed AI JSON', () => {
  expect(() => parseAndNormalizeBeatmap('{not-json', options)).toThrow('Malformed')
})

test.each([
  [{ difficulty: 'HARD', notes: [{ lane: 0, startMs: 1000, type: 'tap' }] }, 'does not match'],
  [{ bpm: 500, notes: [{ lane: 0, startMs: 1000, type: 'tap' }] }, 'BPM'],
  [{ offsetMs: 9000, notes: [{ lane: 0, startMs: 1000, type: 'tap' }] }, 'offset'],
])('rejects invalid beatmap metadata', (beatmap, message) => {
  expect(() => normalizeBeatmap(beatmap, options)).toThrow(message)
})

test('fallback generation is deterministic and includes valid holds', () => {
  const input = { songId: '2d160809-91e3-41a9-91c1-a260e2593598', difficulty: 'HARD', durationMs: 120000 }
  const first = generateFallbackBeatmap(input)
  const second = generateFallbackBeatmap(input)
  expect(first).toEqual(second)
  expect(first.notes.some((note) => note.type === 'hold')).toBe(true)
})

test('malformed AI response retries once then falls back', async () => {
  const song = { id: 'song-seed', title: 'Fallback', durationSecs: 30 }
  const aiRequest = jest.fn().mockResolvedValue('{bad')
  const generated = await generateBeatmap(song, 'EASY', { aiRequest })
  expect(aiRequest).toHaveBeenCalledTimes(2)
  expect(generated.source).toBe('FALLBACK')
  expect(generated.beatmap.notes.length).toBeGreaterThan(0)
})

test('AI charts that end early retry once then fall back to full-song coverage', async () => {
  const song = { id: 'full-song-seed', title: 'Full Song', durationSecs: 30 }
  const sparseChart = JSON.stringify({
    difficulty: 'MEDIUM',
    notes: [
      { lane: 0, startMs: 1000, type: 'tap' },
      { lane: 1, startMs: 2000, type: 'tap' },
      { lane: 2, startMs: 3000, type: 'tap' },
      { lane: 3, startMs: 4000, type: 'tap' },
    ],
  })
  const aiRequest = jest.fn().mockResolvedValue(sparseChart)

  const generated = await generateBeatmap(song, 'MEDIUM', { aiRequest })
  const lastNoteMs = Math.max(...generated.beatmap.notes.map((note) => note.endMs || note.startMs))

  expect(aiRequest).toHaveBeenCalledTimes(2)
  expect(generated.source).toBe('FALLBACK')
  expect(lastNoteMs).toBeGreaterThanOrEqual(27000)
})
