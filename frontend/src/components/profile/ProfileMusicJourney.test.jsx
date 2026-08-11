import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProfileMusicJourney from './ProfileMusicJourney'

const score = (id, value) => ({
  accuracy: 90, createdAt: '2026-08-03', difficulty: 'EASY', id, rank: 'A',
  score: value, song: { title: `Song ${id}` },
})

describe('ProfileMusicJourney', () => {
  it('labels and renders the five latest attempts without collapsing difficulties', () => {
    const attempts = [
      score('one', 600),
      { ...score('two', 500), difficulty: 'MEDIUM', song: { title: 'Song one' } },
      score('three', 400),
      score('four', 300),
      score('five', 200),
      score('six', 100),
    ]
    render(<MemoryRouter><ProfileMusicJourney scores={attempts} /></MemoryRouter>)
    expect(screen.getByText('Latest rhythm game attempts')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(5)
    expect(screen.getAllByText('Song one')).toHaveLength(2)
    expect(screen.getByText(/MEDIUM/)).toBeInTheDocument()
    expect(screen.queryByText('Song six')).not.toBeInTheDocument()
  })

  it('links a friendly empty state to rhythm games', () => {
    render(<MemoryRouter><ProfileMusicJourney scores={[]} /></MemoryRouter>)
    expect(screen.getByText('Play a rhythm game to begin your music journey.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Play rhythm game' })).toHaveAttribute('href', '/rhythm-game')
  })
})
