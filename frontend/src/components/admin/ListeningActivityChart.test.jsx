import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ListeningActivityChart from './ListeningActivityChart'

const activity = [
  { date: '2026-08-01', label: '1 Aug', playbacks: 4, views: 7 },
  { date: '2026-08-02', label: '2 Aug', playbacks: 2, views: 3 },
]

afterEach(cleanup)

describe('ListeningActivityChart', () => {
  it('shows the full date and both identified series in a tooltip', () => {
    render(<ListeningActivityChart series={activity} />)
    const point = screen.getByRole('button', { name: /1 August 2026: 7 song views and 4 playback starts/i })
    fireEvent.mouseEnter(point)

    const tooltip = screen.getAllByRole('tooltip')[0]
    expect(tooltip).toHaveTextContent('1 August 2026')
    expect(tooltip).toHaveTextContent(/Song views\s*7/)
    expect(tooltip).toHaveTextContent(/Playback starts\s*4/)
  })

  it('makes every date available through keyboard focus and accessible text', () => {
    render(<ListeningActivityChart series={activity} />)
    const point = screen.getByRole('button', { name: /2 August 2026: 3 song views and 2 playback starts/i })
    point.focus()
    expect(point).toHaveFocus()
    expect(point).toHaveAttribute('aria-describedby', 'listening-tooltip-2026-08-02')
  })

  it('renders loading, empty, and recoverable error states', () => {
    const { rerender } = render(<ListeningActivityChart loading />)
    expect(screen.getByRole('status', { name: 'Loading listening activity' })).toBeInTheDocument()

    rerender(<ListeningActivityChart series={[]} />)
    expect(screen.getByRole('heading', { name: 'No listening activity yet' })).toBeInTheDocument()

    const onRetry = vi.fn()
    rerender(<ListeningActivityChart error="Network unavailable" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
