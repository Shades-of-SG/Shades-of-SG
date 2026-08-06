import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminContentPage from './AdminContentPage'

const mocks = vi.hoisted(() => ({
  archiveAdminSong: vi.fn(), assignSongToFolder: vi.fn(), createPlatformFolder: vi.fn(),
  getAdminFolders: vi.fn(), getAdminSongs: vi.fn(), getFolderSongProposals: vi.fn(),
  publishAdminSong: vi.fn(), refreshSummary: vi.fn(), removeSongFromFolder: vi.fn(),
  restoreAdminSong: vi.fn(), reviewFolderSongProposal: vi.fn(), unpublishAdminSong: vi.fn(), updateAdminFolder: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ token: 'admin-token' }) }))
vi.mock('../hooks/useAdminSummary', () => ({
  default: () => ({ data: { tabCounts: { collections: 1, placementRequests: 2, songs: 2 } }, error: '', loading: false, refresh: mocks.refreshSummary }),
}))
vi.mock('../services/adminService', () => mocks)
vi.mock('../components/admin/ContextAuditHistory', () => ({ default: () => <section aria-label="Context audit history" /> }))

const statuses = ['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED']
const readySong = {
  artist: 'Amira Tan', audioUrl: 'https://media.example.test/song.mp3', availableActions: ['VIEW_DETAILS', 'PREVIEW', 'PUBLISH', 'ARCHIVE'],
  coverImageUrl: 'https://media.example.test/cover.jpg', creator: { email: 'amira@example.test', id: 'creator-1', name: 'Amira Tan' },
  description: 'A neighbourhood song.', folders: [{ id: 'folder-1', name: 'Heritage Voices', status: 'APPROVED' }], generationStatus: 'COMPLETED',
  id: 'song-ready', languages: ['English'], publishReadiness: { missingFields: [], ready: true }, publiclyVisible: false,
  publishedDate: null, status: 'READY', theme: 'Home', title: 'River Lights', updatedAt: '2026-08-01T08:00:00.000Z', videoUrl: 'https://media.example.test/song.mp4',
}
const publicSong = {
  ...readySong, artist: 'Other Artist', availableActions: ['VIEW_DETAILS', 'PREVIEW', 'UNPUBLISH', 'ARCHIVE'], creator: { email: 'other@example.test', id: 'creator-2', name: 'Other Creator' },
  folders: [], id: 'song-public', publiclyVisible: true, publishedDate: '2026-08-01T08:00:00.000Z', status: 'PUBLISHED', title: 'Public Song',
}
const eligibleSong = { ...publicSong, creator: readySong.creator, id: 'song-eligible', title: 'Second Published Song' }
const folder = {
  allowedTransitions: ['ARCHIVED'], description: 'Published community songs.', displayOrder: 2, id: 'folder-1', membershipCount: 1,
  name: 'Heritage Voices', origin: 'PLATFORM', publiclyVisible: true, songs: [publicSong], status: 'APPROVED', updatedAt: '2026-08-01T08:00:00.000Z',
}
const placement = {
  allowedTransitions: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'], approvalEligibility: { eligible: true, issues: [] },
  createdAt: '2026-08-01T08:00:00.000Z', creatorNote: 'This fits the collection.', folder: { id: 'folder-1', name: 'Heritage Voices', status: 'APPROVED' },
  id: 'placement-1', reviewNote: null, reviewedAt: null, song: publicSong, status: 'PENDING', updatedAt: '2026-08-01T08:00:00.000Z',
}

function renderPage(entry = '/admin/content') {
  return render(<MemoryRouter initialEntries={[entry]}><Routes><Route element={<AdminContentPage />} path="/admin/content" /></Routes></MemoryRouter>)
}

describe('Admin Content workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAdminSongs.mockImplementation((_token, filters) => Promise.resolve({ songStatuses: statuses, songs: filters?.status === 'PUBLISHED' ? [publicSong, eligibleSong] : [readySong, publicSong], visibilityOptions: ['PUBLIC', 'NOT_PUBLIC'] }))
    mocks.getAdminFolders.mockResolvedValue({ folderOrigins: ['PLATFORM', 'CREATOR_PROPOSAL'], folderStatuses: ['PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'ARCHIVED'], folders: [folder] })
    mocks.getFolderSongProposals.mockResolvedValue({ placementStatuses: ['PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'], proposals: [placement] })
    mocks.refreshSummary.mockResolvedValue(undefined)
  })

  afterEach(() => cleanup())

  it('shows workflow and visibility separately with creator, collection, preview, and readiness details', async () => {
    renderPage()
    const table = await screen.findByRole('table', { name: 'All creator songs' })
    const readyRow = within(table).getByText('River Lights').closest('tr')
    expect(within(readyRow).getByText('Ready')).toBeInTheDocument()
    expect(within(readyRow).getByText('Not public')).toBeInTheDocument()
    expect(within(readyRow).getByText('Heritage Voices')).toBeInTheDocument()
    expect(within(readyRow).getByRole('link', { name: 'Amira Tan' })).toHaveAttribute('href', '/creators/creator-1')

    const trigger = within(readyRow).getByRole('button', { name: 'View details' })
    trigger.focus(); fireEvent.click(trigger)
    const drawer = screen.getByRole('complementary', { name: 'Song review' })
    expect(within(drawer).getByText('Required metadata and media are complete. Publishing makes this song available in the public library.')).toBeInTheDocument()
    expect(within(drawer).getByLabelText('Video preview for River Lights')).toHaveAttribute('preload', 'metadata')
    expect(within(drawer).getByLabelText('Audio preview for River Lights')).toBeInTheDocument()
    expect(mocks.publishAdminSong).not.toHaveBeenCalled()
    fireEvent.click(within(drawer).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('opens an exact song review deep link from a safety case', async () => {
    mocks.getAdminSongs.mockResolvedValue({ pagination: { page: 1, totalPages: 1 }, songStatuses: statuses, songs: [publicSong], visibilityOptions: ['PUBLIC', 'NOT_PUBLIC'] })
    renderPage('/admin/content?tab=songs&songId=song-public')

    expect(await screen.findByRole('complementary', { name: 'Song review' })).toHaveTextContent('Public Song')
    expect(mocks.getAdminSongs).toHaveBeenCalledWith('admin-token', expect.objectContaining({ songId: 'song-public' }))
  })

  it('blocks duplicate publish submission while pending and updates the row and detail without reloading the list', async () => {
    let resolvePublish
    mocks.publishAdminSong.mockReturnValue(new Promise((resolve) => { resolvePublish = resolve }))
    renderPage()
    const more = await screen.findByRole('button', { name: 'More actions for River Lights' })
    fireEvent.click(more)
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    const dialog = screen.getByRole('dialog', { name: 'Publish River Lights?' })
    const confirm = within(dialog).getByRole('button', { name: 'Publish song' })
    fireEvent.click(confirm)
    await waitFor(() => expect(within(dialog).getByRole('button', { name: /Working/ })).toBeDisabled())
    fireEvent.click(within(dialog).getByRole('button', { name: /Working/ }))
    expect(mocks.publishAdminSong).toHaveBeenCalledTimes(1)
    resolvePublish({ song: { ...readySong, availableActions: ['VIEW_DETAILS', 'PREVIEW', 'UNPUBLISH', 'ARCHIVE'], publiclyVisible: true, publishedDate: '2026-08-03T08:00:00.000Z', status: 'PUBLISHED' } })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const row = screen.getByText('River Lights').closest('tr')
    expect(within(row).getByText('Published')).toBeInTheDocument()
    expect(within(row).getByText('Public')).toBeInTheDocument()
    expect(mocks.getAdminSongs).toHaveBeenCalledTimes(1)
    expect(mocks.refreshSummary).toHaveBeenCalledTimes(1)
  })

  it('explains unpublish consequences and requires a reason', async () => {
    mocks.unpublishAdminSong.mockResolvedValue({ song: { ...publicSong, availableActions: ['VIEW_DETAILS', 'PREVIEW', 'PUBLISH', 'ARCHIVE'], publiclyVisible: false, publishedDate: null, status: 'READY' } })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'More actions for Public Song' }))
    fireEvent.click(screen.getByRole('button', { name: 'Unpublish' }))
    const dialog = screen.getByRole('dialog', { name: 'Unpublish Public Song?' })
    expect(dialog).toHaveTextContent('scores, reflections, analytics, generation records, and collection links remain intact')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Unpublish song' }))
    expect(mocks.unpublishAdminSong).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('A reason is required')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Reason' }), { target: { value: 'Rights review.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Unpublish song' }))
    await waitFor(() => expect(mocks.unpublishAdminSong).toHaveBeenCalledWith('song-public', 'Rights review.', 'admin-token'))
  })

  it('uses server pagination instead of fetching the full song dataset for client counting', async () => {
    mocks.getAdminSongs.mockResolvedValue({ pagination: { page: 1, totalPages: 2 }, songStatuses: statuses, songs: [readySong], visibilityOptions: ['PUBLIC', 'NOT_PUBLIC'] })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
    await waitFor(() => expect(mocks.getAdminSongs).toHaveBeenLastCalledWith('admin-token', expect.objectContaining({ limit: 25, page: 2 })))
  })

  it('validates collection creation and manages membership without implying publication changes', async () => {
    mocks.createPlatformFolder.mockResolvedValue({ folder })
    mocks.assignSongToFolder.mockResolvedValue({ link: {} })
    mocks.removeSongFromFolder.mockResolvedValue(undefined)
    renderPage('/admin/content?tab=collections')
    fireEvent.click(await screen.findByRole('button', { name: 'Create collection' }))
    const createDialog = screen.getByRole('dialog', { name: 'Create collection' })
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Create collection' }))
    expect(mocks.createPlatformFolder).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('at least two characters')
    fireEvent.change(within(createDialog).getByRole('textbox', { name: 'Name' }), { target: { value: 'New Collection' } })
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Create collection' }))
    await waitFor(() => expect(mocks.createPlatformFolder).toHaveBeenCalled())

    fireEvent.click(await screen.findByRole('button', { name: 'Review details' }))
    const drawer = screen.getByRole('complementary', { name: 'Collection details' })
    expect(drawer).toHaveTextContent('Collection membership does not publish or transfer ownership of a song')
    fireEvent.change(within(drawer).getByRole('combobox', { name: 'Add a published song' }), { target: { value: 'song-eligible' } })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Add song' }))
    await waitFor(() => expect(mocks.assignSongToFolder).toHaveBeenCalledWith('folder-1', 'song-eligible', 1, 'admin-token'))
    fireEvent.click(within(drawer).getByRole('button', { name: 'Remove Public Song from Heritage Voices' }))
    await waitFor(() => expect(mocks.removeSongFromFolder).toHaveBeenCalledWith('folder-1', 'song-public', 'admin-token'))
    expect(screen.getByRole('status')).toHaveTextContent('The song remains published and creator-owned')
  })

  it('uses authoritative placement transitions, records approval intent, and keeps an honest empty state', async () => {
    mocks.reviewFolderSongProposal.mockResolvedValue({ proposal: { ...placement, allowedTransitions: [], status: 'APPROVED' } })
    renderPage('/admin/content?tab=placements')
    fireEvent.click(await screen.findByRole('button', { name: 'Review' }))
    const drawer = screen.getByRole('complementary', { name: 'Placement request' })
    expect(within(drawer).getByText('This fits the collection.')).toBeInTheDocument()
    expect(within(drawer).getByText('Approval adds collection membership only. Song ownership remains with the creator.')).toBeInTheDocument()
    fireEvent.click(within(drawer).getByRole('button', { name: 'Approve' }))
    const dialog = screen.getByRole('dialog', { name: 'Approve placement?' })
    expect(dialog).toHaveTextContent('Creator ownership and existing content data remain unchanged')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(mocks.reviewFolderSongProposal).toHaveBeenCalledWith('placement-1', expect.objectContaining({ status: 'APPROVED' }), 'admin-token'))

    cleanup(); mocks.getFolderSongProposals.mockResolvedValue({ placementStatuses: ['PENDING'], proposals: [] }); renderPage('/admin/content?tab=placements')
    expect(await screen.findByText('Creators have not requested placement into a platform collection. Requests appear here when submitted.')).toBeInTheDocument()
  })
})
