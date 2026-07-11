import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'
import { badgePresentation } from '../components/profile/badgeDefinitions'
import { scoreGrade } from '../components/profile/profileUtils'

function renderProfile(fetchImplementation) {
  localStorage.setItem('authToken', 'registered-token')
  localStorage.setItem('authUser', JSON.stringify({ createdAt: '2025-05-01T00:00:00Z', email: 'ferlyn@example.com', id: 'user-1', name: 'Ferlyn', role: 'REGISTERED' }))
  window.history.pushState({}, '', '/profile')
  vi.stubGlobal('fetch', vi.fn(fetchImplementation))
  return render(<AuthProvider><App /></AuthProvider>)
}

function response(data, ok = true) { return Promise.resolve({ json: async () => data, ok, status: ok ? 200 : 500 }) }

describe('registered Profile', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('renders authenticated identity, earned badges, counts, memories, and scores', async () => {
    renderProfile((url) => {
      if (String(url).includes('/badges/')) return response({ badges: [{ earnedAt: '2026-01-01', id: 'b1', name: 'First Memory' }, { earnedAt: '2026-02-01', id: 'b2', name: 'Local Listener' }] })
      if (String(url).includes('/reflections/mine')) return response({ reflections: [{ content: 'A memory of home.', createdAt: '2026-01-02', displayMode: 'PROFILE', id: 'r1', isOwner: true, song: { title: 'Home' }, songId: 's1', tags: ['Home'] }] })
      return response({ scores: [{ accuracy: 96, createdAt: '2026-01-03', difficulty: 'EASY', id: 'g1', score: 1234, song: { title: 'Home' }, songId: 's1' }] })
    })
    expect(await screen.findByRole('heading', { name: 'Ferlyn' })).toBeInTheDocument()
    expect(screen.getByText('First Memory')).toBeInTheDocument()
    expect(screen.getByText('Local Listener')).toBeInTheDocument()
    expect(screen.getByText('A keepsake collected during your Shades of SG journey.')).toBeInTheDocument()
    expect(screen.getByText('A memory of home.')).toBeInTheDocument()
    expect(screen.getByLabelText('Edit memory')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete memory')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('Achievements earned').previousSibling).toHaveTextContent('2')
  })

  it('shows the empty keepsake state when no badges are earned', async () => {
    renderProfile((url) => response(String(url).includes('/badges/') ? { badges: [] } : String(url).includes('/scores/') ? { scores: [] } : { reflections: [] }))
    expect(await screen.findByText('Your keepsake shelf is waiting')).toBeInTheDocument()
  })

  it('keeps other sections usable when one profile request fails', async () => {
    renderProfile((url) => String(url).includes('/badges/') ? response({ message: 'Badge service unavailable' }, false) : response(String(url).includes('/scores/') ? { scores: [] } : { reflections: [] }))
    expect(await screen.findByText('Badge service unavailable')).toBeInTheDocument()
    expect(screen.getByText('No memories shared yet')).toBeInTheDocument()
    expect(screen.getByText('No rhythm scores yet')).toBeInTheDocument()
  })
})

describe('profile presentation helpers', () => {
  it.each([[95, 'S'], [90, 'A'], [80, 'B'], [70, 'C'], [69, 'D'], [null, null]])('grades %s accuracy as %s', (accuracy, grade) => expect(scoreGrade(accuracy)).toBe(grade))
  it('uses neutral metadata for an unknown badge', () => expect(badgePresentation('Unknown')).toMatchObject({ category: 'Journey' }))
})
