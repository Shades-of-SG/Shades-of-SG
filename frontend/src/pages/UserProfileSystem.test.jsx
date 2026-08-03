import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'

function response(data, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({ json: async () => data, ok, status })
}

const profilePayload = {
  account: { email: 'ferlyn@example.com', isCreator: true, role: 'CREATOR', userId: 'user-1' },
  badges: [{ description: 'Shared a first memory.', earnedAt: '2026-01-01', id: 'badge-1', name: 'First Memory' }],
  profile: {
    avatarUrl: 'https://images.example/avatar.jpg', bio: 'A listener who collects stories.', createdAt: '2025-01-01',
    displayName: 'Ferlyn Ng', fontSize: 'MEDIUM', location: 'Singapore', preferredLanguage: 'English',
    interestTags: [],
    profileVisibility: 'PUBLIC', reducedMotion: false, showBadges: true, showReflections: true,
    showRhythmRanking: true, theme: 'DARK', userId: 'user-1',
  },
  reflections: [{ content: 'A memory of home.', createdAt: '2026-01-02', displayMode: 'PROFILE', id: 'reflection-1', song: { title: 'Home' }, songId: 'song-1', tags: ['Home'] }],
  rhythm: {
    bestLeaderboardRank: { accuracy: 96, difficulty: 'EASY', position: 2, score: 4321, songId: 'song-1', songTitle: 'Home' },
    bestScore: 4321,
    gamesCompleted: 7,
    gamesPlayed: 7,
    rank: 2,
    topScores: [{ accuracy: 96, createdAt: '2026-01-03', difficulty: 'EASY', id: 'score-1', rank: 'S', score: 4321, song: { title: 'Home' } }],
  },
}

function authenticate(role = 'CREATOR') {
  localStorage.setItem('authToken', 'account-token')
  localStorage.setItem('authUser', JSON.stringify({ createdAt: '2025-01-01', email: 'ferlyn@example.com', id: 'user-1', name: 'Account Name', role, sharedProfile: profilePayload.profile }))
}

describe('shared user profile system', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('renders creator accounts as normal user activity on /profile', async () => {
    authenticate()
    window.history.pushState({}, '', '/profile')
    vi.stubGlobal('fetch', vi.fn(() => response(profilePayload)))
    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('heading', { level: 1, name: 'Ferlyn Ng' })).toBeInTheDocument()
    expect(screen.getByText('Creator & Memory Keeper')).toBeInTheDocument()
    expect(screen.getByText('First Memory')).toBeInTheDocument()
    expect(screen.getAllByText('4,321').length).toBeGreaterThan(0)
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.getByText('Best leaderboard rank')).toBeInTheDocument()
    expect(screen.getByText('Home · Easy')).toBeInTheDocument()
    expect(screen.getByText('4,321 points · 96.00%')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Top rhythm game scores')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Creator profile/ })).toHaveAttribute('href', '/creator/profile')
    expect(screen.queryByText('Studio Activity')).not.toBeInTheDocument()
  })

  it('saves shared profile, preference, and privacy changes through the owner API', async () => {
    authenticate('REGISTERED')
    window.history.pushState({}, '', '/settings#profile')
    const fetchMock = vi.fn((url, options = {}) => {
      if (options.method === 'PATCH') {
        const values = JSON.parse(options.body)
        return response({ profile: { ...profilePayload.profile, ...values } })
      }
      return response(profilePayload)
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<AuthProvider><App /></AuthProvider>)

    const name = await screen.findByLabelText('Display name')
    fireEvent.change(name, { target: { value: 'Ferlyn Tan' } })
    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'LIGHT' } })
    fireEvent.click(screen.getByRole('button', { name: 'National Day' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Show rhythm summary/i }))
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(fetchMock.mock.calls.some(([url, options]) => String(url).includes('/users/me/profile') && options?.method === 'PATCH')).toBe(true))
    const patchCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH')
    expect(JSON.parse(patchCall[1].body)).toMatchObject({
      displayName: 'Ferlyn Tan', interestTags: ['National Day'], showRhythmRanking: false, theme: 'LIGHT',
    })
    expect(await screen.findByText('Settings saved.')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('authUser'))).toMatchObject({
      name: 'Ferlyn Tan', sharedProfile: { interestTags: ['National Day'] },
    })
  })

  it('enforces the bio limit, trims an empty bio, and caps interest selection at six', async () => {
    authenticate('REGISTERED')
    window.history.pushState({}, '', '/settings/profile')
    const fetchMock = vi.fn((url, options = {}) => {
      if (options.method === 'PATCH') {
        const values = JSON.parse(options.body)
        return response({ profile: { ...profilePayload.profile, ...values } })
      }
      return response(profilePayload)
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<AuthProvider><App /></AuthProvider>)

    const bio = await screen.findByLabelText(/Bio/)
    fireEvent.change(bio, { target: { value: 'x'.repeat(501) } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Use 500 characters or fewer.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'PATCH')).toBe(false)

    fireEvent.change(bio, { target: { value: '   ' } })
    const tags = ['National Day', 'Racial Harmony Day', 'Total Defence Day', 'Chinese Culture', 'Malay Culture', 'Indian Culture']
    tags.forEach((tag) => fireEvent.click(screen.getByRole('button', { name: tag })))
    fireEvent.click(screen.getByRole('button', { name: 'Peranakan Heritage' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose up to 6 interests.')
    expect(screen.getByRole('button', { name: 'Peranakan Heritage' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'PATCH')).toBe(true))
    const patchCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH')
    expect(JSON.parse(patchCall[1].body)).toMatchObject({ bio: '', interestTags: tags })
  })

  it('provides protected settings sections and redirects legacy creator settings safely', async () => {
    authenticate('CREATOR')
    window.history.pushState({}, '', '/creator/settings')
    vi.stubGlobal('fetch', vi.fn(() => response(profilePayload)))
    render(<AuthProvider><App /></AuthProvider>)

    await waitFor(() => expect(window.location.pathname).toBe('/settings/profile'))
    expect(await screen.findByRole('navigation', { name: 'Settings sections' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/settings/profile')
    expect(screen.getByRole('link', { name: 'Account & Security' })).toHaveAttribute('href', '/settings/account-security')
    expect(screen.getByRole('link', { name: 'Data & Privacy' })).toHaveAttribute('href', '/settings/data-privacy')
    expect(screen.getByText(/Email changes require password confirmation/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reset password' })).toHaveAttribute('href', '/forgot-password')
  })

  it('does not expose settings to an unauthenticated visitor', async () => {
    window.history.pushState({}, '', '/settings/profile')
    render(<AuthProvider><App /></AuthProvider>)

    await waitFor(() => expect(window.location.pathname).toBe('/login'))
    expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument()
  })

  it('renders only public-safe activity on /users/:userId', async () => {
    window.history.pushState({}, '', '/users/user-1')
    vi.stubGlobal('fetch', vi.fn(() => response({ ...profilePayload, isOwner: false, profile: { ...profilePayload.profile, isCreator: true } })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('heading', { name: 'Ferlyn Ng' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Reflections' })).toBeInTheDocument()
    expect(screen.getByText('A memory of home.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit Profile' })).not.toBeInTheDocument()
  })

  it('renders public bio and canonical interests as text without interpreting markup', async () => {
    window.history.pushState({}, '', '/users/user-1')
    vi.stubGlobal('fetch', vi.fn(() => response({
      ...profilePayload,
      isOwner: false,
      profile: {
        ...profilePayload.profile,
        bio: '<img src=x onerror=alert(1)>',
        interestTags: ['National Day', 'Community Stories'],
      },
    })))
    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Interests')).toHaveTextContent('National Day')
    expect(screen.getByLabelText('Interests')).toHaveTextContent('Community Stories')
  })

  it('explains when a public user has no ranked rhythm-game scores', async () => {
    window.history.pushState({}, '', '/users/user-1')
    vi.stubGlobal('fetch', vi.fn(() => response({
      ...profilePayload,
      isOwner: false,
      rhythm: { bestLeaderboardRank: null, bestScore: 0, gamesCompleted: 0, gamesPlayed: 0, rank: null, topScores: [] },
    })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByText('No ranked rhythm-game scores yet')).toBeInTheDocument()
  })

  it('uses a non-revealing unavailable state for private profiles', async () => {
    window.history.pushState({}, '', '/users/private-user')
    vi.stubGlobal('fetch', vi.fn(() => response({ message: 'User profile not found.' }, false, 404)))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('heading', { name: 'Profile unavailable' })).toBeInTheDocument()
    expect(screen.queryByText('User profile not found.')).not.toBeInTheDocument()
  })
})
