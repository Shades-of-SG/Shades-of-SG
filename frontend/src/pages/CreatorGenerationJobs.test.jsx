import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import CreatorGenerationJobs from './CreatorGenerationJobs'

function jsonResponse(body, status = 200) {
  return {
    headers: { get: () => 'application/json' },
    json: async () => body,
    ok: status >= 200 && status < 300,
    status,
  }
}

describe('CreatorGenerationJobs', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'creator-token')
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('stores extracted audio duration when creating the song for generation', async () => {
    let createdSongPayload
    const fetchMock = vi.fn(async (url, options = {}) => {
      const path = String(url)
      if (path.endsWith('/songs/extract-audio')) {
        return jsonResponse({ audioUrl: 'https://media.example/extracted.mp3', duration: 87, success: true })
      }
      if (path.endsWith('/songs') && options.method === 'POST') {
        createdSongPayload = JSON.parse(options.body)
        return jsonResponse({ data: { id: 'generated-song' }, success: true }, 201)
      }
      if (path.endsWith('/generation/start')) {
        return jsonResponse({ data: { id: 'job-1' }, success: true }, 202)
      }
      return jsonResponse({ data: [], success: true })
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('alert', vi.fn())

    render(<MemoryRouter><AuthProvider><CreatorGenerationJobs /></AuthProvider></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Compile New Video' }))
    fireEvent.change(screen.getByPlaceholderText('Paste YouTube link here...'), {
      target: { value: 'https://www.youtube.com/watch?v=example' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Extract MP3' }))
    expect(await screen.findByRole('button', { name: /Audio Saved/ })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Song Title'), { target: { value: 'Duration Test' } })
    fireEvent.change(screen.getByPlaceholderText(/Paste lyrics manually/), { target: { value: 'Test lyrics' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate AI Video Now' }))

    await waitFor(() => expect(createdSongPayload).toMatchObject({
      audioUrl: 'https://media.example/extracted.mp3',
      durationSecs: 87,
      title: 'Duration Test',
    }))
  })
})
