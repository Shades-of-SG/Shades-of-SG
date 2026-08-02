import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { SessionProvider, useSession } from './SessionContext'
import { AUTH_EXPIRED_EVENT } from '../utils/authEvents'

function StateProbe() {
  const { activeMode, isAuthenticated, signOut, token, user } = useAuth()
  const { session } = useSession()
  return <>
    <output aria-label="auth state">{JSON.stringify({ activeMode, isAuthenticated, sessionId: session?.id || null, token, userId: user?.id || null })}</output>
    <button onClick={signOut} type="button">Sign out probe</button>
  </>
}

function renderProviders() {
  return render(<AuthProvider><SessionProvider><StateProbe /></SessionProvider></AuthProvider>)
}

function readState() {
  return JSON.parse(screen.getByLabelText('auth state').textContent)
}

describe('authentication and guest session restoration', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ profile: { displayName: 'Restored account' } }),
      ok: true,
      status: 200,
    })))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it.each([
    { label: 'corrupted user JSON', token: 'token-value', user: '{bad json' },
    { label: 'a token without a user', token: 'token-value', user: null },
    { label: 'a user without a token', token: null, user: JSON.stringify({ id: 'user-1', role: 'REGISTERED' }) },
  ])('recovers from $label without leaving a partial authenticated state', async ({ token, user }) => {
    if (token) localStorage.setItem('authToken', token)
    if (user) localStorage.setItem('authUser', user)

    renderProviders()

    await waitFor(() => expect(readState().sessionId).toEqual(expect.any(String)))
    expect(readState()).toMatchObject({ isAuthenticated: false, token: null, userId: null })
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(localStorage.getItem('authUser')).toBeNull()
  })

  it('replaces corrupted guest-session JSON with a valid isolated guest session', async () => {
    localStorage.setItem('shadesOfSgGuestSession', '{bad json')

    renderProviders()

    await waitFor(() => expect(readState().sessionId).toEqual(expect.any(String)))
    expect(JSON.parse(localStorage.getItem('shadesOfSgGuestSession'))).toMatchObject({
      id: readState().sessionId,
      type: 'guest',
    })
  })

  it('restores the stored account and mode without creating a guest session', async () => {
    localStorage.setItem('activeMode', 'user')
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({
      accountStatus: 'ACTIVE', creatorAccessStatus: 'ACTIVE', id: 'creator-1', role: 'CREATOR',
    }))
    localStorage.setItem('shadesOfSgGuestSession', JSON.stringify({ id: 'stale-guest', type: 'guest' }))

    renderProviders()

    expect(readState()).toMatchObject({ activeMode: 'user', isAuthenticated: true, sessionId: null, token: 'creator-token', userId: 'creator-1' })
    await waitFor(() => expect(localStorage.getItem('shadesOfSgGuestSession')).toBeNull())
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })

  it('clears an expired account session, preserves mode, and creates a fresh guest session', async () => {
    localStorage.setItem('activeMode', 'creator')
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({
      accountStatus: 'ACTIVE', creatorAccessStatus: 'ACTIVE', id: 'creator-1', role: 'CREATOR',
    }))
    renderProviders()

    await act(async () => { window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT)) })

    await waitFor(() => expect(readState().sessionId).toEqual(expect.any(String)))
    expect(readState()).toMatchObject({ activeMode: 'creator', isAuthenticated: false, token: null, userId: null })
    expect(localStorage.getItem('activeMode')).toBe('creator')
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(localStorage.getItem('authUser')).toBeNull()
  })

  it('creates a fresh guest session after an explicit logout', async () => {
    localStorage.setItem('authToken', 'user-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'user-1', role: 'REGISTERED' }))
    renderProviders()

    fireEvent.click(screen.getByRole('button', { name: 'Sign out probe' }))

    await waitFor(() => expect(readState().sessionId).toEqual(expect.any(String)))
    expect(readState()).toMatchObject({ isAuthenticated: false, token: null, userId: null })
  })
})
