import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'
import CreatorProfileSettings from './CreatorProfileSettings'

function response(data, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({ json: async () => data, ok, status })
}

describe('public creator profile', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('shows public work without private studio controls', async () => {
    window.history.pushState({}, '', '/creators/creator-1')
    vi.stubGlobal('fetch', vi.fn(() => response({
      collections: [{ id: 'folder-1', name: 'Home Stories', slug: 'home-stories', songs: [{ id: 'song-1' }] }],
      isOwner: false,
      profile: {
        avatarUrl: '', bio: 'A public biography.', contentFocus: ['Heritage'], creatorId: 'creator-1', creatorSince: '2025',
        creatorTitle: 'Creator & Storyteller', displayName: 'Violet', featuredQuote: 'Stories become songs.',
        languages: ['English'], location: 'Singapore', socialLinks: { instagram: 'https://instagram.com/violet' }, tagline: 'Songs inspired by home.',
      },
      reflections: [{ content: 'A lovely memory.', createdAt: '2026-07-01', displayName: 'Mei', id: 'reflection-1', isAnonymous: false, song: { title: 'Orchid Skies' } }],
      songs: [{ id: 'song-1', languages: ['English'], publishedDate: '2026-07-02', theme: 'Heritage', title: 'Orchid Skies' }],
      stats: { communityReflections: 1, publishedCollections: 1, publishedSongs: 1 },
    })))

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('heading', { level: 1, name: 'Violet' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Orchid Skies' })).toBeInTheDocument()
    expect(screen.getByText('Home Stories')).toBeInTheDocument()
    expect(screen.getByText('A lovely memory.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: "Visit Violet's Instagram" })).toHaveAttribute('target', '_blank')
    expect(screen.queryByRole('link', { name: "Visit Violet's Website" })).not.toBeInTheDocument()
    expect(screen.queryByText('Studio Activity')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Continue Editing' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit Profile' })).not.toBeInTheDocument()
  })

  it('shows an unavailable state for a private profile', async () => {
    window.history.pushState({}, '', '/creators/private-creator')
    vi.stubGlobal('fetch', vi.fn(() => response({ message: 'Creator profile not found.' }, false, 404)))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('heading', { name: 'Creator profile unavailable' })).toBeInTheDocument()
    expect(screen.queryByText('Creator profile not found.')).not.toBeInTheDocument()
  })
})

describe('creator profile settings', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Account Violet', role: 'CREATOR' }))
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('loads persisted defaults and saves public profile fields separately from account fields', async () => {
    const profile = {
      avatarUrl: '', bio: 'Original bio', contentFocus: ['Heritage'], creatorId: 'creator-1', creatorSince: '2025',
      creatorTitle: 'Creator', displayName: 'Violet', featuredQuote: 'Original quote', languages: ['English'],
      location: 'Singapore', showCommunityReflections: true, socialLinks: {}, tagline: 'Original tagline', visibility: 'PUBLIC',
    }
    const fetchMock = vi.fn((url, options = {}) => {
      if (String(url).includes('/creators/me/profile') && options.method === 'PATCH') {
        return response({ profile: { ...profile, displayName: JSON.parse(options.body).displayName } })
      }
      return response({ profile })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><MemoryRouter initialEntries={['/creator/profile/edit']}><Routes><Route element={<CreatorProfileSettings />} path="/creator/profile/edit" /><Route element={<p>Saved</p>} path="/creator/profile" /></Routes></MemoryRouter></AuthProvider>)

    expect(await screen.findByText('Change photo or display name in Account Settings')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Creator title'), { target: { value: 'Story Composer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    const patchCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH')
    expect(JSON.parse(patchCall[1].body)).toMatchObject({ creatorTitle: 'Story Composer', visibility: 'PUBLIC' })
    expect(JSON.parse(patchCall[1].body).displayName).toBeUndefined()
    expect(JSON.parse(patchCall[1].body).email).toBeUndefined()
  })

  it('validates social URLs before sending an update', async () => {
    const profile = { ...Object.fromEntries(['avatarUrl', 'bio', 'creatorTitle', 'displayName', 'featuredQuote', 'location', 'tagline'].map((key) => [key, ''])), contentFocus: [], languages: [], showCommunityReflections: true, socialLinks: {}, visibility: 'PUBLIC' }
    profile.displayName = 'Violet'
    const fetchMock = vi.fn(() => response({ profile }))
    vi.stubGlobal('fetch', fetchMock)
    render(<AuthProvider><MemoryRouter><CreatorProfileSettings /></MemoryRouter></AuthProvider>)

    await screen.findByLabelText('Website')
    fireEvent.change(screen.getByLabelText('Website'), { target: { value: 'javascript:alert(1)' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Enter a complete http or https URL.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'PATCH')).toBe(false)
  })

  it('treats bare protocol placeholders and removed links as empty values', async () => {
    const profile = { avatarUrl: '', bio: '', contentFocus: [], creatorTitle: '', displayName: 'Violet', featuredQuote: '', languages: [], location: '', showCommunityReflections: true, socialLinks: { instagram: 'https://instagram.com/violet' }, tagline: '', visibility: 'PUBLIC' }
    const fetchMock = vi.fn((url, options = {}) => options.method === 'PATCH' ? response({ profile: { ...profile, socialLinks: {} } }) : response({ profile }))
    vi.stubGlobal('fetch', fetchMock)
    render(<AuthProvider><MemoryRouter initialEntries={['/creator/profile/edit']}><Routes><Route element={<CreatorProfileSettings />} path="/creator/profile/edit" /><Route element={<p>Saved</p>} path="/creator/profile" /></Routes></MemoryRouter></AuthProvider>)

    await screen.findByDisplayValue('https://instagram.com/violet')
    fireEvent.change(screen.getByLabelText('Instagram'), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText('Website'), { target: { value: 'https://' } })
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    const patchCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH')
    expect(JSON.parse(patchCall[1].body).socialLinks).toMatchObject({ instagram: null, website: null })
  })
})
