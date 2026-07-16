import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import Navbar from './Navbar'

function renderRegisteredNavbar() {
  localStorage.setItem('authToken', 'registered-token')
  localStorage.setItem('authUser', JSON.stringify({
    id: 'user-1',
    name: 'Ferlyn',
    role: 'REGISTERED',
  }))

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/profile']}>
        <Navbar role="user" />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('registered user navbar', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it('keeps public navigation visible and puts account actions in a dropdown', () => {
    const { container } = renderRegisteredNavbar()

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Songs' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Learning Hub' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rhythm Game' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reflection Wall' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change language' })).toBeInTheDocument()
    expect(container.querySelector('.registered-navbar__avatar img')).toHaveAttribute('src', '/images/Default_pfp.jpg')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /open user menu/i }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('USER MENU')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'View Profile' })).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('menuitem', { name: 'Edit Profile' })).toHaveAttribute('href', '/settings#profile')
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/settings')
  })

  it('signs the user out from the account dropdown', () => {
    renderRegisteredNavbar()

    fireEvent.click(screen.getByRole('button', { name: /open user menu/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Logout' }))

    expect(localStorage.getItem('authToken')).toBeNull()
    expect(localStorage.getItem('authUser')).toBeNull()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
