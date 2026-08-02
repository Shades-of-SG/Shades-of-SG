import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { SessionProvider } from '../context/SessionContext'
import Login from './Login'
import OtpVerification from './OtpVerification'
import Register from './Register'
import RegistrationSuccess from './RegistrationSuccess'

function response(data, { ok = true, status = 200 } = {}) {
  return Promise.resolve({
    headers: { get: () => null },
    json: async () => data,
    ok,
    status,
  })
}

function LocationProbe({ label }) {
  const location = useLocation()
  return <div>{label}: {location.pathname}{location.search}{location.hash}</div>
}

function renderLogin(fetchImplementation, initialEntry = '/login') {
  vi.stubGlobal('fetch', vi.fn(fetchImplementation))
  return render(
    <AuthProvider>
      <SessionProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route element={<Login />} path="/login" />
            <Route element={<div>Admin destination</div>} path="/admin" />
            <Route element={<div>Creator destination</div>} path="/creator/dashboard" />
            <Route element={<div>Profile destination</div>} path="/profile" />
            <Route element={<LocationProbe label="Settings destination" />} path="/settings" />
            <Route element={<div>Public destination</div>} path="/" />
            <Route element={<div>Verification destination</div>} path="/verify-email" />
          </Routes>
        </MemoryRouter>
      </SessionProvider>
    </AuthProvider>,
  )
}

describe('authentication onboarding pages', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
    document.querySelectorAll('script[src*="accounts.google.com"], script[src*="appleid.cdn-apple.com"]').forEach((script) => script.remove())
    delete window.google
    delete window.AppleID
    vi.unstubAllGlobals()
  })

  it('uses one role-free login and continues as a real guest', async () => {
    renderLogin(() => response({ appleAuthEnabled: false }))

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /apple/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Continue as guest' }))

    expect(await screen.findByText('Public destination')).toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBeNull()
  })

  it('redirects after login from the database-provided role', async () => {
    const fetchMock = vi.fn((url) => String(url).endsWith('/auth/config')
      ? response({ appleAuthEnabled: false })
      : response({ token: 'admin-token', user: { email: 'admin@example.com', id: 'admin-1', role: 'ADMIN' } }))
    renderLogin(fetchMock)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' ADMIN@EXAMPLE.COM ' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct horse battery staple' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Admin destination')).toBeInTheDocument()
    const loginRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/login'))
    expect(JSON.parse(loginRequest[1].body)).toEqual({ email: 'admin@example.com', password: 'correct horse battery staple' })
    expect(JSON.parse(localStorage.getItem('authUser'))).toMatchObject({ role: 'ADMIN' })
  })

  it('validates login fields and prevents duplicate submissions while a request is pending', async () => {
    let resolveLogin
    const fetchMock = vi.fn((url) => String(url).endsWith('/auth/config')
      ? response({ appleAuthEnabled: false })
      : new Promise((resolve) => { resolveLogin = resolve }))
    const view = renderLogin(fetchMock)
    const form = view.container.querySelector('form')

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid-email' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } })
    fireEvent.submit(form)
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Password must be between 8 and 128 characters.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/login'))).toHaveLength(0)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'listener@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/login'))).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()

    await act(async () => {
      resolveLogin(await response({ token: 'user-token', user: { email: 'listener@example.com', id: 'user-1', role: 'REGISTERED' } }))
    })
    expect(await screen.findByText('Profile destination')).toBeInTheDocument()
  })

  it('clears a guest session and preserves the requested protected location after login', async () => {
    localStorage.setItem('shadesOfSgGuestSession', JSON.stringify({ createdAt: '2026-01-01', id: 'guest-1', rhythmScores: [], triviaScores: [], type: 'guest' }))
    const fetchMock = vi.fn((url) => String(url).endsWith('/auth/config')
      ? response({ appleAuthEnabled: false })
      : response({ token: 'user-token', user: { email: 'listener@example.com', id: 'user-1', role: 'REGISTERED' } }))
    renderLogin(fetchMock, {
      pathname: '/login',
      state: { from: { hash: '#alerts', pathname: '/settings', search: '?tab=privacy' } },
    })

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'listener@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Settings destination: /settings?tab=privacy#alerts')).toBeInTheDocument()
    expect(localStorage.getItem('shadesOfSgGuestSession')).toBeNull()
  })

  it('redirects unverified accounts and shows restricted-account errors', async () => {
    const unverified = vi.fn((url) => String(url).endsWith('/auth/config')
      ? response({ appleAuthEnabled: false })
      : response({ code: 'EMAIL_UNVERIFIED', message: 'Verify your email before signing in.' }, { ok: false, status: 403 }))
    renderLogin(unverified)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pending@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Verification destination')).toBeInTheDocument()
    expect(sessionStorage.getItem('pendingVerificationEmail')).toBe('pending@example.com')

    cleanup()
    const restricted = vi.fn((url) => String(url).endsWith('/auth/config')
      ? response({ appleAuthEnabled: false })
      : response({ code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended.' }, { ok: false, status: 403 }))
    renderLogin(restricted)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'restricted@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Your account has been suspended.')
  })

  it('renders Google Identity Services and signs in from its verified credential callback', async () => {
    let googleCallback
    const googleScript = document.createElement('script')
    googleScript.src = 'https://accounts.google.com/gsi/client'
    googleScript.dataset.loaded = 'true'
    document.head.appendChild(googleScript)
    window.google = { accounts: { id: {
      initialize: vi.fn((options) => { googleCallback = options.callback }),
      renderButton: vi.fn((element) => {
        const button = document.createElement('button')
        button.textContent = 'Continue with Google'
        element.appendChild(button)
      }),
    } } }
    const fetchMock = vi.fn((url) => {
      const path = String(url)
      if (path.endsWith('/auth/config')) return response({ googleAuthEnabled: true, googleClientId: 'google-client', appleAuthEnabled: false })
      if (path.endsWith('/auth/oauth/challenge')) return response({ nonce: 'signed-nonce', state: 'signed-state' })
      if (path.endsWith('/auth/oauth/google')) return response({ token: 'creator-token', user: { email: 'Rose@gmail.com', id: 'creator-1', role: 'CREATOR' } })
      throw new Error(`Unexpected request: ${path}`)
    })
    renderLogin(fetchMock)

    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
    await act(async () => { await googleCallback({ credential: 'google-id-token' }) })
    expect(await screen.findByText('Creator destination')).toBeInTheDocument()
    const request = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/oauth/google'))
    expect(JSON.parse(request[1].body)).toEqual({ credential: 'google-id-token', nonce: 'signed-nonce' })
  })

  it('exchanges an Apple authorization code and preserves the database role', async () => {
    const appleScript = document.createElement('script')
    appleScript.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
    appleScript.dataset.loaded = 'true'
    document.head.appendChild(appleScript)
    window.AppleID = { auth: {
      init: vi.fn(),
      signIn: vi.fn().mockResolvedValue({
        authorization: { code: 'apple-code', state: 'signed-state' },
        user: { name: { firstName: 'Rose', lastName: 'Tay' } },
      }),
    } }
    const fetchMock = vi.fn((url) => {
      const path = String(url)
      if (path.endsWith('/auth/config')) return response({
        appleAuthEnabled: true, appleClientId: 'sg.shades.web',
        appleRedirectUri: 'https://example.com/login', googleAuthEnabled: false,
      })
      if (path.endsWith('/auth/oauth/challenge')) return response({ nonce: 'signed-nonce', state: 'signed-state' })
      if (path.endsWith('/auth/oauth/apple')) return response({ token: 'creator-token', user: { email: 'Rose@example.com', id: 'creator-1', role: 'CREATOR' } })
      throw new Error(`Unexpected request: ${path}`)
    })
    renderLogin(fetchMock)

    fireEvent.click(await screen.findByRole('button', { name: 'Continue with Apple' }))
    expect(await screen.findByText('Creator destination')).toBeInTheDocument()
    const request = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/oauth/apple'))
    expect(JSON.parse(request[1].body)).toMatchObject({ code: 'apple-code', nonce: 'signed-nonce', state: 'signed-state' })
  })

  it('registers a normal account without a client-selected role and opens OTP verification', async () => {
    const fetchMock = vi.fn(() => response({ message: 'Verification code sent.' }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route element={<Register />} path="/register" />
          <Route element={<div>Verification destination</div>} path="/verify-email" />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: ' Mei Lin ' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' MEI@EXAMPLE.COM ' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-pass-123' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'secure-pass-123' } })
    fireEvent.click(screen.getByLabelText(/I accept the Terms of Use/))
    fireEvent.click(screen.getByLabelText(/I accept the Privacy Policy/))
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Verification destination')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const values = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(values).toEqual({
      acceptPrivacy: true,
      acceptTerms: true,
      email: 'mei@example.com',
      name: 'Mei Lin',
      password: 'secure-pass-123',
    })
    expect(values).not.toHaveProperty('role')
    expect(sessionStorage.getItem('pendingVerificationEmail')).toBe('mei@example.com')
  })

  it('shows field-specific registration errors and independent password controls', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><Register /></MemoryRouter>)

    const password = screen.getByLabelText('Password')
    const confirmation = screen.getByLabelText('Confirm password')
    expect(password).toHaveAttribute('type', 'password')
    expect(confirmation).toHaveAttribute('type', 'password')
    expect(screen.getByText('Use between 8 and 128 characters.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(confirmation).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Show password confirmation' }))
    expect(confirmation).toHaveAttribute('type', 'text')

    fireEvent.change(password, { target: { value: 'secure-pass-123' } })
    fireEvent.change(confirmation, { target: { value: 'different-pass-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Full name must be between 2 and 255 characters.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(screen.getByText('Accept the Terms of Use to continue.')).toBeInTheDocument()
    expect(screen.getByText('Accept the Privacy Policy to continue.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses neutral guidance when the registration email cannot be used', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response({ message: 'This email cannot be used.' }, { ok: false, status: 409 })))
    render(<MemoryRouter><Register /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Mei Lin' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-pass-123' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'secure-pass-123' } })
    fireEvent.click(screen.getByLabelText(/I accept the Terms of Use/))
    fireEvent.click(screen.getByLabelText(/I accept the Privacy Policy/))
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('This email cannot be used. Continue to sign in or recover your account.')).toBeInTheDocument()
  })

  it('signs in only after a successful registration OTP verification', async () => {
    sessionStorage.setItem('pendingVerificationEmail', 'verified@example.com')
    const fetchMock = vi.fn((url) => String(url).endsWith('/auth/verify-email')
      ? response({
        message: 'Email verified successfully. You are now signed in.',
        token: 'verified-token',
        user: { email: 'verified@example.com', emailVerified: true, id: 'verified-1', role: 'REGISTERED' },
      })
      : response({ profile: { displayName: 'Verified User' } }))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/verify-email']}>
          <Routes>
            <Route element={<OtpVerification />} path="/verify-email" />
            <Route element={<RegistrationSuccess />} path="/registration-success" />
            <Route element={<div>Profile destination</div>} path="/profile" />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(localStorage.getItem('authToken')).toBeNull()
    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '246810' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }))

    expect(await screen.findByText(/you are now signed in/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue to your profile' })).toHaveAttribute('href', '/profile')
    expect(localStorage.getItem('authToken')).toBe('verified-token')
    expect(JSON.parse(localStorage.getItem('authUser'))).toMatchObject({ emailVerified: true, role: 'REGISTERED' })
    expect(sessionStorage.getItem('pendingVerificationEmail')).toBeNull()
  })

  it('submits registration once while a request is in flight', async () => {
    let resolveRequest
    const fetchMock = vi.fn(() => new Promise((resolve) => { resolveRequest = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route element={<Register />} path="/register" />
          <Route element={<div>Verification destination</div>} path="/verify-email" />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Mei Lin' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'mei-once@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-pass-123' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'secure-pass-123' } })
    fireEvent.click(screen.getByLabelText(/I accept the Terms of Use/))
    fireEvent.click(screen.getByLabelText(/I accept the Privacy Policy/))
    const form = screen.getByRole('button', { name: 'Create account' }).closest('form')
    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled()
    resolveRequest(await response({ message: 'Verification code sent.' }, { status: 201 }))
    expect(await screen.findByText('Verification destination')).toBeInTheDocument()
  })

  it('shows a temporary server message for 503 and always clears loading state', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response({ message: 'Email delivery is temporarily unavailable.' }, { ok: false, status: 503 })))
    render(<MemoryRouter><Register /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Mei Lin' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'mei-retry@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-pass-123' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'secure-pass-123' } })
    fireEvent.click(screen.getByLabelText(/I accept the Terms of Use/))
    fireEvent.click(screen.getByLabelText(/I accept the Privacy Policy/))
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('The account service is temporarily unavailable. Please wait a moment and try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled()
  })
})
