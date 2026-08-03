const { buildDeterministicSceneBlocks, groupSegmentsByTargetDuration } = require('../services/aiScenePlanner')

describe('buildDeterministicSceneBlocks', () => {
  it('groups 55 short Whisper segments (~3.27s each) for a 3-minute song into 25-30 scene blocks averaging ~6.5s', () => {
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

    const blocks = buildDeterministicSceneBlocks(rawSegments)

    expect(blocks.length).toBeGreaterThanOrEqual(25)
    expect(blocks.length).toBeLessThanOrEqual(30)

    for (let i = 0; i < blocks.length - 1; i++) {
      const scene = blocks[i]
      const duration = scene.endTime - scene.startTime
      expect(duration).toBeGreaterThanOrEqual(5.0)
      expect(duration).toBeLessThanOrEqual(8.5)
    }

    expect(blocks[0].startTime).toBe(0.0)
    expect(blocks[blocks.length - 1].endTime).toBeCloseTo(179.85, 1)
  })

  it('locks repeating chorus lines into canonical scene blocks', () => {
    const chorusLines = [
      { start: 30.0, end: 33.2, text: 'Stand up for Singapore' },
      { start: 33.2, end: 36.5, text: 'Do your best for Singapore' },
    ]
    const repeatChorus = [
      { start: 120.0, end: 123.2, text: 'Stand up for Singapore' },
      { start: 123.2, end: 126.5, text: 'Do your best for Singapore' },
    ]

    const segments = [
      { start: 0, end: 6.5, text: 'Intro segment text line' },
      ...chorusLines,
      { start: 40, end: 46.5, text: 'Verse 1 text segment line' },
      ...repeatChorus,
    ]

    const blocks = buildDeterministicSceneBlocks(segments)

    const chorusBlock1 = blocks.find(b => b.lyrics.includes('Stand up for Singapore'))
    const chorusBlock2 = blocks.filter(b => b.lyrics.includes('Stand up for Singapore'))[1]

    expect(chorusBlock1).toBeDefined()
    expect(chorusBlock2).toBeDefined()
    expect(chorusBlock1.lyrics).toBe('Stand up for Singapore Do your best for Singapore')
    expect(chorusBlock2.lyrics).toBe('Stand up for Singapore Do your best for Singapore')
  })

  it('handles empty input gracefully', () => {
    expect(buildDeterministicSceneBlocks([])).toEqual([])
    expect(buildDeterministicSceneBlocks(null)).toEqual([])
  })
})

describe('normalizeCacheKey helper logic', () => {
  const normalizeCacheKey = (str) => {
    if (!str || typeof str !== 'string') return ''
    return str
      .toLowerCase()
      .replace(/\[.*?\]/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  it('normalizes lyrics by stripping section headers, line breaks, punctuation, and extra whitespace', () => {
    const chorus1 = '[Chorus]\nStand Up For Singapore, Do Your Best!'
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
