import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { AuthProvider } from './context/AuthContext'

describe('App', () => {
  it('renders the public landing shell', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /shades of sg/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse songs/i })).toBeInTheDocument()
  })
})
