import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PaginatedSongSelect from './PaginatedSongSelect'
import { getReflectionSongs } from '../services/reflectionService'

vi.mock('../services/reflectionService', () => ({ getReflectionSongs: vi.fn() }))

function page(items, pagination) {
  items.pagination = pagination
  return items
}

describe('PaginatedSongSelect', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('searches on the server and safely ignores stale results', async () => {
    let resolveOld
    getReflectionSongs
      .mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve }))
      .mockResolvedValueOnce(page([{ id: 'new', title: 'New result' }], { page: 1, hasNextPage: false }))
    render(<PaginatedSongSelect allLabel="All songs" initialSongs={[]} onChange={() => {}} value="" />)

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search song' }), { target: { value: 'old' } })
    await new Promise((resolve) => setTimeout(resolve, 275))
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search song' }), { target: { value: 'new' } })
    await waitFor(() => expect(getReflectionSongs).toHaveBeenLastCalledWith({ page: 1, search: 'new' }))
    resolveOld(page([{ id: 'old', title: 'Old result' }], { page: 1, hasNextPage: false }))

    expect(await screen.findByRole('option', { name: 'New result' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Old result' })).not.toBeInTheDocument()
  })

  it('appends later pages without duplicate options', async () => {
    const initial = page([{ id: 'one', title: 'One' }], { page: 1, hasNextPage: true })
    getReflectionSongs.mockResolvedValue(page([{ id: 'one', title: 'One' }, { id: 'two', title: 'Two' }], { page: 2, hasNextPage: false }))
    render(<PaginatedSongSelect allLabel="All songs" initialSongs={initial} onChange={() => {}} value="" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Load more song options' }))
    expect(await screen.findByRole('option', { name: 'Two' })).toBeInTheDocument()
    expect(screen.getAllByRole('option', { name: 'One' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Load more song options' })).not.toBeInTheDocument()
  })

  it('retains loaded options and exposes retry after a later-page failure', async () => {
    const initial = page([{ id: 'one', title: 'One' }], { page: 1, hasNextPage: true })
    getReflectionSongs.mockRejectedValue(new Error('Song options unavailable'))
    render(<PaginatedSongSelect allLabel="All songs" initialSongs={initial} onChange={() => {}} value="" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Load more song options' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Song options unavailable')
    expect(screen.getByRole('option', { name: 'One' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})
