const { groupSegmentsByTargetDuration } = require('../services/aiScenePlanner')

describe('groupSegmentsByTargetDuration', () => {
  it('groups 55 short Whisper segments (~3.2s each) for a 3-minute song into 25-32 scenes averaging 6-8s', () => {
    const rawSegments = []
    let currentTime = 0.0
    for (let i = 1; i <= 55; i++) {
      const duration = 3.27
      const endTime = Number((currentTime + duration).toFixed(2))
      rawSegments.push({
        start: Number(currentTime.toFixed(2)),
        end: endTime,
        text: `Whisper line ${i} of song lyrics`,
      })
      currentTime = endTime
    }

    const groupedScenes = groupSegmentsByTargetDuration(rawSegments, 5.0, 7.5)

    expect(groupedScenes.length).toBeGreaterThanOrEqual(25)
    expect(groupedScenes.length).toBeLessThanOrEqual(32)

    for (let i = 0; i < groupedScenes.length - 1; i++) {
      const scene = groupedScenes[i]
      const sceneDuration = scene.endTime - scene.startTime
      expect(sceneDuration).toBeGreaterThanOrEqual(5.0)
      expect(sceneDuration).toBeLessThanOrEqual(9.5)
    }

    expect(groupedScenes[0].startTime).toBe(0.0)
    expect(groupedScenes[groupedScenes.length - 1].endTime).toBeCloseTo(179.85, 1)
  })

  it('handles empty input gracefully', () => {
    expect(groupSegmentsByTargetDuration([])).toEqual([])
    expect(groupSegmentsByTargetDuration(null)).toEqual([])
  })
})

describe('normalizeCacheKey helper logic', () => {
  const normalizeCacheKey = (str) => {
    if (!str || typeof str !== 'string') return ''
    return str
      .toLowerCase()
      .replace(/\[.*?\]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  it('normalizes lyrics by stripping section headers, punctuation, and extra whitespace', () => {
    const chorus1 = '[Chorus] Stand Up For Singapore, Do Your Best!'
    const chorus2 = 'Stand up for Singapore! do your best'

    expect(normalizeCacheKey(chorus1)).toBe('stand up for singapore do your best')
    expect(normalizeCacheKey(chorus2)).toBe('stand up for singapore do your best')
    expect(normalizeCacheKey(chorus1)).toBe(normalizeCacheKey(chorus2))
  })

  it('handles empty or non-string inputs safely', () => {
    expect(normalizeCacheKey(null)).toBe('')
    expect(normalizeCacheKey(undefined)).toBe('')
    expect(normalizeCacheKey('')).toBe('')
  })
})
