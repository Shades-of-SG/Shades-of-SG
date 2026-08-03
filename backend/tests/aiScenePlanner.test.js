const { generateScenePlan, buildDeterministicSceneBlocks, groupSegmentsByTargetDuration } = require('../services/aiScenePlanner')

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

describe('buildHookAwareSceneBlocks', () => {
  const { buildHookAwareSceneBlocks } = require('../services/aiScenePlanner')

  it('isolates the main hook line into a standalone scene while grouping verse lines into 6-8s blocks', () => {
    const rawSegments = [
      { start: 0.0, end: 3.2, text: 'Raise your head to the skies' },
      { start: 3.2, end: 6.5, text: 'This is how we all begin' },
      { start: 6.5, end: 9.8, text: 'See the fire in your eyes' },
      { start: 9.8, end: 12.5, text: "Cause tomorrow's here today" },
      { start: 12.5, end: 16.0, text: 'Take the world by the hand' },
      { start: 16.0, end: 19.5, text: 'Step into a brand new day' },
      { start: 19.5, end: 22.0, text: "Cause tomorrow's here today" },
    ]

    const blocks = buildHookAwareSceneBlocks(rawSegments, "Cause tomorrow's here today")

    // Verse 1 (lines 1 & 2): 0.0s to 6.5s (6.5s duration)
    expect(blocks[0].startTime).toBe(0.0)
    expect(blocks[0].endTime).toBe(6.5)
    expect(blocks[0].lyrics).toBe('Raise your head to the skies This is how we all begin')

    // Verse 2 (line 3): 6.5s to 9.8s (3.3s duration before isolated hook)
    expect(blocks[1].startTime).toBe(6.5)
    expect(blocks[1].endTime).toBe(9.8)

    // Isolated Hook 1 (line 4): 9.8s to 12.5s (2.7s duration)
    expect(blocks[2].startTime).toBe(9.8)
    expect(blocks[2].endTime).toBe(12.5)
    expect(blocks[2].lyrics).toBe("Cause tomorrow's here today")

    // Verse 3 (lines 5 & 6): 12.5s to 19.5s (7.0s duration)
    expect(blocks[3].startTime).toBe(12.5)
    expect(blocks[3].endTime).toBe(19.5)

    // Isolated Hook 2 (line 7): 19.5s to 22.0s (2.5s duration)
    expect(blocks[4].startTime).toBe(19.5)
    expect(blocks[4].endTime).toBe(22.0)
    expect(blocks[4].lyrics).toBe("Cause tomorrow's here today")
  })

  it('handles empty or missing segments gracefully', () => {
    const { buildHookAwareSceneBlocks } = require('../services/aiScenePlanner')
    expect(buildHookAwareSceneBlocks([])).toEqual([])
    expect(buildHookAwareSceneBlocks(null)).toEqual([])
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

jest.mock('../models', () => ({
  GenerationJob: {
    findByPk: jest.fn(),
  },
  Song: {
    findByPk: jest.fn(),
  },
  SceneSegment: {
    destroy: jest.fn().mockResolvedValue(true),
    bulkCreate: jest.fn().mockImplementation((records) => Promise.resolve(records)),
  },
}))

jest.mock('openai', () => {
  const mockCreate = jest.fn()
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  }
})

describe('generateScenePlan LLM integration & fallback', () => {
  const { GenerationJob, Song, SceneSegment } = require('../models')
  const { OpenAI } = require('openai')
  const mockOpenAIInstance = new OpenAI()

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('accepts short 2-4s hook scenes and saves chorus prompt repeat annotations when LLM succeeds', async () => {
    GenerationJob.findByPk.mockResolvedValue({ id: 'job-1', status: 'PROCESSING', save: jest.fn() })
    Song.findByPk.mockResolvedValue({
      id: 'song-1',
      title: "Tomorrow's Here Today",
      artist: '53A',
      transcriptionSegments: [
        { start: 0, end: 12.5, text: 'Raise your head to the skies' },
        { start: 12.5, end: 15.5, text: "Cause tomorrow's here today" },
        { start: 15.5, end: 28.0, text: 'Chorus 2 repeat section' },
      ],
    })

    const expectedLlmResponse = {
      scenes: [
        {
          startTime: 0,
          endTime: 12.5,
          lyrics: 'Raise your head to the skies',
          visualPrompt: 'A vast sunrise sky over Singapore skyline.',
        },
        {
          startTime: 12.5,
          endTime: 15.5,
          lyrics: "Cause tomorrow's here today",
          visualPrompt: 'Close up punchline hook shot of young performers.',
        },
        {
          startTime: 15.5,
          endTime: 28.0,
          lyrics: 'Chorus 2 repeat section',
          visualPrompt: 'Close up punchline hook shot of young performers. Repeat of earlier scene for chorus continuity.',
        },
      ],
    }

    mockOpenAIInstance.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(expectedLlmResponse) } }],
    })

    const result = await generateScenePlan('job-1', 'song-1')

    expect(result.length).toBe(3)
    // Short 3s hook scene (12.5s - 15.5s) accepted
    expect(result[1].startTime).toBe(12.5)
    expect(result[1].endTime).toBe(15.5)
    expect(result[1].lyrics).toBe("Cause tomorrow's here today")

    // Chorus repeat visual prompt preserved
    expect(result[2].visualPrompt).toContain('Repeat of earlier scene for chorus continuity.')
    expect(SceneSegment.bulkCreate).toHaveBeenCalled()
  })

  it('falls back to buildDeterministicSceneBlocks when LLM fails or returns invalid response', async () => {
    GenerationJob.findByPk.mockResolvedValue({ id: 'job-2', status: 'PROCESSING', save: jest.fn() })
    Song.findByPk.mockResolvedValue({
      id: 'song-2',
      title: 'Fallback Song',
      artist: 'Artist',
      transcriptionSegments: [
        { start: 0, end: 3.5, text: 'Segment 1' },
        { start: 3.5, end: 7.0, text: 'Segment 2' },
      ],
    })

    mockOpenAIInstance.chat.completions.create.mockRejectedValue(new Error('LLM connection error'))

    const result = await generateScenePlan('job-2', 'song-2')

    expect(result.length).toBeGreaterThan(0)
    expect(SceneSegment.bulkCreate).toHaveBeenCalled()
  })
})

