/**
 * Owner: Ferlyn
 * Feature: Song Section Services
 */
const { ensureSongSectionRecommendations, formatSongSectionsLyrics, recommendSongSections, validateSongSections } = require('../services/songSectionService')

const transcriptSegments = [
  { start: 0, end: 10, text: 'Opening line' },
  { start: 10, end: 20, text: 'We sing the hook' },
  { start: 20, end: 30, text: 'We sing the hook' },
]

function response(sections) {
  return { choices: [{ message: { content: JSON.stringify({ sections }) } }] }
}

function validSections() {
  return [
    { type: 'verse', label: 'Verse', startTime: 0, endTime: 10, lyrics: 'Opening line', confidence: 0.8, reason: 'Opening narrative' },
    { type: 'chorus', label: 'Hook', startTime: 10, endTime: 20, lyrics: 'We sing the hook', confidence: 0.9, reason: 'Repeated hook' },
    { type: 'chorus', label: 'Hook again', startTime: 20, endTime: 30, lyrics: 'We sing the hook', confidence: 0.9, reason: 'Repeated hook' },
  ]
}

test('normalizes repeated chorus labels', () => {
  const sections = validateSongSections({ sections: validSections() }, { durationSecs: 30, transcriptSegments })
  expect(sections.map((section) => section.label)).toEqual(['Verse', 'Chorus 1', 'Chorus 2'])
})

test('formats confirmed sections as canonical labelled lyrics', () => {
  const sections = validateSongSections({ sections: validSections() }, { durationSecs: 30, transcriptSegments })
  expect(formatSongSectionsLyrics(sections)).toBe(
    '[Verse]\nOpening line\n\n[Chorus 1]\nWe sing the hook\n\n[Chorus 2]\nWe sing the hook'
  )
})

test('rejects overlapping and out-of-duration recommendations', () => {
  const overlap = validSections(); overlap[1].startTime = 9
  expect(() => validateSongSections({ sections: overlap }, { durationSecs: 30, transcriptSegments })).toThrow('overlaps')
  const tooLong = validSections(); tooLong[2].endTime = 31
  expect(() => validateSongSections({ sections: tooLong }, { durationSecs: 30, transcriptSegments })).toThrow('audio duration')
})

test('rejects lyrics invented outside the Whisper transcript', () => {
  const invented = validSections(); invented[0].lyrics = 'Words never transcribed'
  expect(() => validateSongSections({ sections: invented }, { durationSecs: 30, transcriptSegments })).toThrow('not present')
})

test('retries one malformed DeepSeek response then returns validated sections', async () => {
  const create = jest.fn()
    .mockResolvedValueOnce({ choices: [{ message: { content: '{bad' } }] })
    .mockResolvedValueOnce(response(validSections()))
  const result = await recommendSongSections({ client: { chat: { completions: { create } } }, durationSecs: 30, segments: transcriptSegments })

  expect(create).toHaveBeenCalledTimes(2)
  expect(result[1].label).toBe('Chorus 1')
  expect(create.mock.calls[0][0]).toMatchObject({
    model: 'deepseek-v4-pro', response_format: { type: 'json_object' }, thinking: { type: 'disabled' },
  })
})

test('fails after one retry when DeepSeek returns empty responses', async () => {
  const create = jest.fn().mockResolvedValue({ choices: [{ message: { content: '' } }] })
  await expect(recommendSongSections({ client: { chat: { completions: { create } } }, durationSecs: 30, segments: transcriptSegments })).rejects.toThrow('empty response')
  expect(create).toHaveBeenCalledTimes(2)
})

test('does not overwrite creator-confirmed recommendations', async () => {
  const confirmed = validSections()
  const song = {
    sectionRecommendations: confirmed,
    sectionRecommendationsConfirmedAt: new Date(),
    update: jest.fn(),
  }

  await expect(ensureSongSectionRecommendations(song)).resolves.toBe(confirmed)
  expect(song.update).not.toHaveBeenCalled()
  await expect(ensureSongSectionRecommendations(song, { force: true })).rejects.toMatchObject({ status: 409 })
})
