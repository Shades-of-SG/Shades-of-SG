import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProtectedRoute from './ProtectedRoute'

describe('ProtectedRoute auth hydration', () => {
  it('waits at the protected destination while authentication is loading', () => {
    render(
      <MemoryRouter initialEntries={['/rhythm-game/claim']}>
        <Routes>
          <Route element={<ProtectedRoute isAllowed={false} isLoading><p>Claim content</p></ProtectedRoute>} path="/rhythm-game/claim" />
          <Route element={<p>Login destination</p>} path="/login" />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Restoring your session')
    expect(screen.queryByText('Login destination')).not.toBeInTheDocument()
  })
})
