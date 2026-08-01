import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

describe('creator Sidebar', () => {
  it('returns creators to the dashboard when the brand logo is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/creator/analytics']}>
        <Sidebar />
        <Routes>
          <Route element={<LocationProbe />} path="*" />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Shades of SG creator dashboard' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/creator/dashboard')
  })
})
