import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GuidedMusicLessons from './GuidedMusicLessons'

// useLabInstruments hits GET /api/instruments/lab-samples on mount — mocked
// out so the test stays hermetic and every instrument stays on its static,
// synthesized definition (data/instruments.js).
vi.mock('../services/instrumentSamplesService', () => ({ getInstrumentLabSamples: vi.fn().mockResolvedValue([]) }))

// jsdom has no Web Audio API — stub just enough of AudioContext for
// playNote()'s synthesized-tone path (see useInstrumentAudio.js) to run
// without throwing when the Play button is clicked.
function stubAudioContext() {
  const gainNode = { connect: vi.fn(), gain: { exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), setValueAtTime: vi.fn() } }
  const oscillatorNode = { connect: vi.fn(), frequency: { setValueAtTime: vi.fn() }, start: vi.fn(), stop: vi.fn(), type: 'sine' }

  vi.stubGlobal(
    'AudioContext',
    vi.fn(function FakeAudioContext() {
      this.close = vi.fn()
      this.createGain = vi.fn(() => gainNode)
      this.createOscillator = vi.fn(() => oscillatorNode)
      this.currentTime = 0
      this.destination = {}
      this.resume = vi.fn()
      this.state = 'running'
    })
  )
}

describe('GuidedMusicLessons stage flow', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    stubAudioContext()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    cleanup()
  })

  it('walks instrument -> song -> difficulty -> lesson, and back navigates one stage at a time', () => {
    render(<GuidedMusicLessons />)

    // Stage 1: instrument
    expect(screen.getByText('Choose Your Instrument')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Play Instrument' })[0])

    // Stage 2: song
    expect(screen.getByText('Choose a Song')).toBeInTheDocument()
    expect(screen.getByText('Our Singapore')).toBeInTheDocument()
    expect(screen.getByText('Giants (2026)')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose This Song' })[0])

    // Stage 3: difficulty, for whichever song was clicked (SONGS[0] = Our Singapore)
    expect(screen.getByRole('heading', { name: 'Our Singapore' })).toBeInTheDocument()
    const startButtons = screen.getAllByRole('button', { name: 'Start' })
    expect(startButtons).toHaveLength(3)
    fireEvent.click(startButtons[0])

    // Stage 4a: listen — hear a sample before learning it
    expect(screen.getByText('Step 1 · Listen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '▶ Play Sample' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /start learning the notes/i }))

    // Stage 4b: lesson — the actual note-by-note teaching transport
    expect(screen.getByText('Step 2 · Learn')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '▶ Play' })).toBeInTheDocument()

    // Back: lesson -> difficulty -> song -> instrument
    fireEvent.click(screen.getByRole('button', { name: /back to difficulty/i }))
    expect(screen.getByRole('heading', { name: 'Our Singapore' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /back to song library/i }))
    expect(screen.getByText('Choose a Song')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /back to instruments/i }))
    expect(screen.getByText('Choose Your Instrument')).toBeInTheDocument()
  })

  it('lets the learner hear a sample, then Play/Pause toggle the teaching transport without throwing', () => {
    render(<GuidedMusicLessons />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Play Instrument' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose This Song' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'Start' })[0])

    // Sample playback on the listen stage also toggles Play/Pause without throwing.
    fireEvent.click(screen.getByRole('button', { name: '▶ Play Sample' }))
    expect(screen.getByRole('button', { name: '⏸ Pause Sample' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '⏸ Pause Sample' }))

    // Starting the teaching stage always begins at note 1, even if the
    // sample was paused partway through.
    fireEvent.click(screen.getByRole('button', { name: /start learning the notes/i }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')

    fireEvent.click(screen.getByRole('button', { name: '▶ Play' }))
    expect(screen.getByRole('button', { name: '⏸ Pause' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '⏸ Pause' }))
    expect(screen.getByRole('button', { name: '▶ Play' })).toBeInTheDocument()
  })

  it('lets the learner play notes themselves via the free-play keyboard, by click or by physical key', () => {
    render(<GuidedMusicLessons />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Play Instrument' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose This Song' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'Start' })[0])
    fireEvent.click(screen.getByRole('button', { name: /start learning the notes/i }))

    // The keyboard's notes come from the song itself (Our Singapore Easy:
    // D4, E4, F#4, G4, A4 — low to high), not the instrument's fixed scale,
    // so sharps like F#4 are included and playable even on piano.
    const keyboard = screen.getByRole('group', { name: /notes for this lesson/i })
    expect(within(keyboard).getByRole('button', { name: 'Play F#4' })).toBeInTheDocument()

    fireEvent.click(within(keyboard).getByRole('button', { name: 'Play D4' }))
    expect(screen.getByRole('button', { name: 'Play D4' })).toHaveClass('is-active')

    // D4 is bound to 'a' (lowest note), E4 to 's' (next lowest).
    fireEvent.keyDown(window, { key: 's' })
    expect(screen.getByRole('button', { name: 'Play E4' })).toHaveClass('is-active')
  })
})
