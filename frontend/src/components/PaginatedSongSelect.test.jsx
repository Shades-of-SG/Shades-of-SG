import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaginatedSongSelect from './PaginatedSongSelect'

vi.mock('../services/reflectionService', () => ({ getReflectionSongs: vi.fn() }))

const songs = [
  { id: 'song-1', title: 'Closer' },
  { id: 'song-2', title: 'Home' },
]

describe('PaginatedSongSelect', () => {
  afterEach(cleanup)

  it('opens a searchable song menu and selects a matching result', () => {
    const onChange = vi.fn()
    render(<PaginatedSongSelect id="reflection-song" initialSongs={songs} label="Song" onChange={onChange} value="song-1" />)

    fireEvent.click(screen.getByRole('combobox', { name: /Song/ }))
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search song' }), { target: { value: 'Home' } })

    expect(screen.queryByRole('option', { name: 'Closer' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'Home' }))
    expect(onChange).toHaveBeenCalledWith('song-2')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
