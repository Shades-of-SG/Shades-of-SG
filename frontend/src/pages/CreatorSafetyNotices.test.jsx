import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import CreatorAccessSuspended from '../components/CreatorAccessSuspended'
import CreatorSongs from './CreatorSongs'
import * as songService from '../services/songService'

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({
  token: 'creator-token', user: { creatorSuspensionReason: 'Creator programme review.', role: 'CREATOR' },
}) }))
vi.mock('../services/songService', () => ({
  archiveSong: vi.fn(), deleteSong: vi.fn(), getCreatorSongs: vi.fn(), startGeneration: vi.fn(), unarchiveSong: vi.fn(),
}))

describe('creator safety notices', () => {
  beforeEach(() => songService.getCreatorSongs.mockResolvedValue([{
    artist: 'Artist', audioUrl: 'audio.mp3', createdAt: '2026-08-01T00:00:00Z', id: 'song-1', latestGenerationJob: null,
    moderationNotice: { actionType: 'SONG_UNPUBLISHED_BY_ADMIN', createdAt: '2026-08-03T00:00:00Z', message: 'This song was unpublished by an administrator after a safety or content review.', safetyPath: '/settings/safety' },
    publishReady: true, rawLyrics: 'Lyrics', status: 'READY', title: 'Affected song', updatedAt: '2026-08-03T00:00:00Z', videoUrl: 'video.mp4',
  }]))
  afterEach(() => { cleanup(); vi.clearAllMocks() })

  it('shows a restrained private song notice linked to the central status area', async () => {
    render(<MemoryRouter><CreatorSongs /></MemoryRouter>)
    expect(await screen.findByText('This song was unpublished by an administrator after a safety or content review.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Safety & Account Status' })).toHaveAttribute('href', '/settings/safety')
  })

  it('explains creator-only suspension while preserving member access and ownership', () => {
    render(<MemoryRouter><CreatorAccessSuspended /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Creator tools are temporarily unavailable' })).toBeInTheDocument()
    expect(screen.getByText(/Existing songs, ownership and stored draft data remain preserved/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Safety & Account Status' })).toHaveAttribute('href', '/settings/safety')
    expect(screen.getByRole('link', { name: /Continue to your profile/ })).toHaveAttribute('href', '/profile')
  })
})
