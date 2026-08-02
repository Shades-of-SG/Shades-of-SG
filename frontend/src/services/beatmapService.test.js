import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateBeatmap, getBeatmap } from './beatmapService'

const storedBeatmap = { beatmap: { difficulty: 'MEDIUM', durationMs: 10000, generationSource: 'AI', notes: [{ id: 'tap', lane: 0, startMs: 1000, type: 'tap' }] } }

describe('beatmap service boundaries', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('public gameplay only performs a stored PUBLISHED beatmap GET', async () => {
    const fetchMock = vi.fn(async () => ({ json: async () => storedBeatmap, ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await getBeatmap('song-1', 'medium')
    expect(result.generationSource).toBe('AI')
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/songs\/song-1\/beatmaps\/medium$/), { headers: undefined, signal: undefined })
    expect(fetchMock.mock.calls.every(([, options]) => !options?.method || options.method === 'GET')).toBe(true)
  })

  it('generation is a separate authenticated creator POST', async () => {
    const fetchMock = vi.fn(async () => ({ json: async () => ({ beatmap: storedBeatmap.beatmap }), ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    await generateBeatmap('song-1', 'HARD', 'creator-token')
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/songs\/song-1\/beatmaps\/generate$/), expect.objectContaining({ method: 'POST' }))
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer creator-token')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ difficulty: 'HARD', mode: 'AI' })
  })

  it('creator preview uses a distinct authenticated endpoint', async () => {
    const fetchMock = vi.fn(async () => ({ json: async () => storedBeatmap, ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    await getBeatmap('song-1', 'medium', { preview: true, token: 'creator-token' })
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/medium\/preview$/), expect.objectContaining({ headers: { Authorization: 'Bearer creator-token' } }))
  })
})
