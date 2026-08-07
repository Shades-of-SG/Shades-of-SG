import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SongSectionsCard from './SongSectionsCard'

const mocks = vi.hoisted(() => ({ recommendSongSections: vi.fn(), saveSongSections: vi.fn() }))
vi.mock('../../services/songService', () => mocks)

const recommendation = {
  type: 'chorus', label: 'Chorus 1', startTime: 10, endTime: 20,
  lyrics: 'Sing the hook', confidence: 0.9, reason: 'Repeated hook',
}

describe('Creator Studio song-section review', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.recommendSongSections.mockResolvedValue({ confirmedAt: null, lyrics: '[Chorus 1]\nSing the hook', sections: [recommendation] })
    mocks.saveSongSections.mockResolvedValue({ confirmedAt: '2026-08-07T00:00:00.000Z', lyrics: '[Chorus 1]\nSing the hook', sections: [recommendation] })
  })

  it('requests editable recommendations after timestamped lyrics exist', async () => {
    const onSaved = vi.fn()
    render(<SongSectionsCard onSaved={onSaved} song={{ durationSecs: 30 }} songId="song-1" token="creator-token" transcriptionSegments={[{ start: 0, end: 10, text: 'Verse' }]} />)
    fireEvent.click(screen.getByRole('button', { name: /recommend sections/i }))

    await waitFor(() => expect(mocks.recommendSongSections).toHaveBeenCalledWith('song-1', 'creator-token', { replaceConfirmed: false }))
    expect(await screen.findByDisplayValue('Chorus 1')).toBeInTheDocument()
    expect(screen.getByText(/review and edit/i)).toBeInTheDocument()
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ lyrics: '[Chorus 1]\nSing the hook' }))
  })

  it('saves creator edits as confirmed sections', async () => {
    render(<SongSectionsCard song={{ durationSecs: 30, sectionRecommendations: [recommendation] }} songId="song-1" token="creator-token" transcriptionSegments={[{ start: 10, end: 20, text: 'Sing the hook' }]} />)
    fireEvent.change(screen.getByDisplayValue('Chorus 1'), { target: { value: 'Main Chorus' } })
    fireEvent.click(screen.getByRole('button', { name: /save & confirm/i }))

    await waitFor(() => expect(mocks.saveSongSections).toHaveBeenCalledWith(
      'song-1', [expect.objectContaining({ label: 'Main Chorus' })], 'creator-token'
    ))
  })

  it('does not offer recommendations before Whisper timestamps exist', () => {
    render(<SongSectionsCard song={{ durationSecs: 30 }} songId="song-1" token="creator-token" transcriptionSegments={[]} />)
    expect(screen.getByRole('button', { name: /recommend sections/i })).toBeDisabled()
    expect(screen.getByText(/extract timestamped lyrics first/i)).toBeInTheDocument()
  })
})
