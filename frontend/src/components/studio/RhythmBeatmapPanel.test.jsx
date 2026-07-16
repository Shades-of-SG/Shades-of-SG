import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RhythmBeatmapPanel from './RhythmBeatmapPanel'

const mocks = vi.hoisted(() => ({ deleteBeatmapDraft: vi.fn(), generateAllBeatmaps: vi.fn(), getBeatmapSummary: vi.fn(), publishBeatmap: vi.fn(), saveBeatmapSettings: vi.fn(), unpublishBeatmap: vi.fn() }))
vi.mock('../../services/beatmapService', () => mocks)

const missing = (difficulty) => ({ difficulty, draft: null, failed: null, published: null, status: 'NOT_CREATED' })
const draft = { bpm: 112, generatedAt: '2026-07-12T10:00:00.000Z', generationSource: 'AI', holdNoteCount: 3, noteCount: 24, offsetMs: 25, status: 'DRAFT', version: 2 }
const published = { ...draft, offsetMs: 10, publishedAt: '2026-07-12T11:00:00.000Z', status: 'PUBLISHED', version: 1 }
const failed = { errorMessage: 'Beatmap generation failed. Please retry.', status: 'FAILED', version: 1 }
const row = (overrides = {}) => ({ ...missing('MEDIUM'), ...overrides, difficulty: 'MEDIUM' })
const rows = (medium = row()) => [missing('EASY'), medium, missing('HARD')]
const renderPanel = (songStatus = 'DRAFT') => render(<MemoryRouter><RhythmBeatmapPanel songId="song-1" songStatus={songStatus} token="creator-token" /></MemoryRouter>)

describe('Studio Rhythm Beatmap panel', () => {
  beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()))
  afterEach(cleanup)

  it('shows optional empty and loading states', async () => {
    let resolveSummary
    mocks.getBeatmapSummary.mockReturnValueOnce(new Promise((resolve) => { resolveSummary = resolve }))
    renderPanel()
    expect(screen.getByText('Loading beatmap status…')).toBeInTheDocument()
    resolveSummary(rows())
    expect(await screen.findByText('No rhythm game has been created for this song.')).toBeInTheDocument()
  })

  it('shows DRAFT metrics, preview, offset editing, save, and publish', async () => {
    mocks.getBeatmapSummary.mockResolvedValue(rows(row({ ...draft, draft, status: 'DRAFT' })))
    mocks.saveBeatmapSettings.mockResolvedValue({}); mocks.publishBeatmap.mockResolvedValue({})
    renderPanel()
    expect(await screen.findByText('24')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Preview' })).toHaveAttribute('href', '/game/song-1?difficulty=MEDIUM&preview=1')
    fireEvent.change(screen.getByLabelText('Draft timing offset'), { target: { value: '75' } })
    fireEvent.click(screen.getByRole('button', { name: /save draft settings/i }))
    await waitFor(() => expect(mocks.saveBeatmapSettings).toHaveBeenCalledWith('song-1', 'MEDIUM', 75, 'creator-token'))
    fireEvent.click(screen.getByRole('button', { name: /publish beatmap/i }))
    await waitFor(() => expect(mocks.publishBeatmap).toHaveBeenCalledWith('song-1', 'MEDIUM', 'creator-token'))
  })

  it('shows published and regenerated-draft states while allowing unpublish', async () => {
    mocks.getBeatmapSummary.mockResolvedValue(rows(row({ ...draft, draft, published, status: 'DRAFT' })))
    mocks.unpublishBeatmap.mockResolvedValue({})
    renderPanel()
    expect(await screen.findByText('Published version remains live')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /unpublish beatmap/i }))
    await waitFor(() => expect(mocks.unpublishBeatmap).toHaveBeenCalled())
  })

  it('explains that a published beatmap stays private until its song is published', async () => {
    mocks.getBeatmapSummary.mockResolvedValue(rows(row({ ...published, published, status: 'PUBLISHED' })))
    renderPanel('READY')
    expect(await screen.findByText('Published beatmaps remain private until this song is fully published.')).toBeInTheDocument()
  })

  it('shows FAILED feedback and regenerates all difficulties without duplicate controls or clicks', async () => {
    let resolveGeneration
    mocks.getBeatmapSummary.mockResolvedValue(rows(row({ failed, status: 'FAILED', ...failed })))
    mocks.generateAllBeatmaps.mockReturnValueOnce(new Promise((resolve) => { resolveGeneration = resolve }))
    renderPanel()
    expect(await screen.findByText(/Beatmap generation failed/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /generate with ai/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /generate basic beatmap/i })).not.toBeInTheDocument()
    const generate = screen.getByRole('button', { name: 'Generate All' })
    fireEvent.click(generate); fireEvent.click(generate)
    expect(mocks.generateAllBeatmaps).toHaveBeenCalledTimes(1)
    expect(mocks.generateAllBeatmaps).toHaveBeenCalledWith('song-1', 'creator-token', 'AI')
    expect(screen.getByRole('button', { name: /generating all/i })).toBeDisabled()
    resolveGeneration({})
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate All' })).toBeEnabled())
  })

  it('saves pending Studio changes before generating beatmaps', async () => {
    const onBeforeGenerate = vi.fn().mockResolvedValue({ durationSecs: 210 })
    mocks.getBeatmapSummary.mockResolvedValue(rows())
    mocks.generateAllBeatmaps.mockResolvedValue({})

    render(
      <MemoryRouter>
        <RhythmBeatmapPanel
          onBeforeGenerate={onBeforeGenerate}
          songId="song-1"
          token="creator-token"
        />
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Generate All' }))
    await waitFor(() => expect(mocks.generateAllBeatmaps).toHaveBeenCalledTimes(1))
    expect(onBeforeGenerate).toHaveBeenCalledTimes(1)
    expect(onBeforeGenerate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.generateAllBeatmaps.mock.invocationCallOrder[0],
    )
  })
})
