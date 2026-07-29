import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import Login from './Login'
import Register from './Register'

function response(data, { ok = true, status = 200 } = {}) {
  return Promise.resolve({
    headers: { get: () => null },
    json: async () => data,
    ok,
    status,
  })
}

function renderLogin(fetchImplementation) {
  vi.stubGlobal('fetch', vi.fn(fetchImplementation))
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<Login />} path="/login" />
          <Route element={<div>Admin destination</div>} path="/admin" />
          <Route element={<div>Creator destination</div>} path="/creator/dashboard" />
          <Route element={<div>Profile destination</div>} path="/profile" />
          <Route element={<div>Public destination</div>} path="/" />
          <Route element={<div>Verification destination</div>} path="/verify-email" />
        </Routes>
      </MemoryRouter>
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
})
