import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSongDetails } from './songDetailsApi'

describe('fetchSongDetails', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the public song endpoint for normal gameplay', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({ song: { id: 'song-1', title: 'Published Song' } }),
      ok: true,
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchSongDetails('song-1')).resolves.toMatchObject({
      id: 'song-1',
      title: 'Published Song',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/songs\/song-1$/),
      expect.objectContaining({ headers: undefined, signal: undefined }),
    )
  })

  it('uses the authenticated creator endpoint for draft preview', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn(async () => ({
      json: async () => ({
        song: {
          audioUrl: 'https://media.example/draft.mp3',
          id: 'draft-song',
          title: 'Draft Song',
        },
      }),
      ok: true,
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchSongDetails('draft-song', {
      preview: true,
      signal: controller.signal,
      token: 'creator-token',
    })).resolves.toMatchObject({
      audioUrl: 'https://media.example/draft.mp3',
      id: 'draft-song',
      title: 'Draft Song',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/songs\/creator\/draft-song$/),
      {
        headers: { Authorization: 'Bearer creator-token' },
        signal: controller.signal,
      },
    )
  })

  it('surfaces the API message when preview access fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ message: 'Please log in to continue.' }),
      ok: false,
    })))

    await expect(fetchSongDetails('draft-song', { preview: true }))
      .rejects.toThrow('Please log in to continue.')
  })
})
