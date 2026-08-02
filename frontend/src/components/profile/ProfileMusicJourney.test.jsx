import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProfileMusicJourney from './ProfileMusicJourney'

const score = (id, value) => ({
  accuracy: 90, createdAt: '2026-08-03', difficulty: 'EASY', id, rank: 'A',
  score: value, song: { title: `Song ${id}` },
})

describe('ProfileMusicJourney', () => {
  it('labels and renders no more than three backend-ranked scores', () => {
    render(<MemoryRouter><ProfileMusicJourney scores={[score('one', 400), score('two', 300), score('three', 200), score('four', 100)]} /></MemoryRouter>)
    expect(screen.getByText('Top rhythm game scores')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.queryByText('Song four')).not.toBeInTheDocument()
  })

  it('links a friendly empty state to rhythm games', () => {
    render(<MemoryRouter><ProfileMusicJourney scores={[]} /></MemoryRouter>)
    expect(screen.getByText('Play a rhythm game to begin your music journey.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Play rhythm game' })).toHaveAttribute('href', '/rhythm-game')
  })
})
