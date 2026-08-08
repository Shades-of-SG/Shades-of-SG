import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useSequencePlayer from './useSequencePlayer'

// useInstrumentAudio ultimately talks to the real Web Audio API, which
// jsdom doesn't implement. A fake AudioContext (matching just the surface
// playSynthesizedNote() needs) is stubbed globally so playNote() runs
// without throwing — the assertions below only care about *when* notes
// play and how the transport's step index moves, not the audio itself.
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

const instrument = { envelope: 'sustained', waveform: 'triangle' }
const note = (label, frequency) => ({ frequency, label })

const steps = [
  { beats: 1, measure: 1, notes: [note('C4', 261.63)], type: 'note' },
  { beats: 1, measure: 1, notes: [note('D4', 293.66)], type: 'note' },
  { beats: 1, measure: 1, notes: [note('E4', 329.63), note('G4', 392)], type: 'chord' },
]

describe('useSequencePlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    stubAudioContext()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts paused at step 0 and does not play until play() is called', () => {
    const { result } = renderHook(() => useSequencePlayer({ bpm: 120, instrument, steps }))

    expect(result.current.isPlaying).toBe(false)
    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.isComplete).toBe(false)
  })

  it('advances one step per beat at the BPM-derived interval', () => {
    const { result } = renderHook(() => useSequencePlayer({ bpm: 120, instrument, steps }))

    // 120 BPM, 1 beat per step -> 500ms per step.
    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(true)
    expect(result.current.currentStepIndex).toBe(0)

    act(() => vi.advanceTimersByTime(500))
    expect(result.current.currentStepIndex).toBe(1)

    act(() => vi.advanceTimersByTime(500))
    expect(result.current.currentStepIndex).toBe(2)
  })

  it('pause freezes the step index and stops further advances', () => {
    const { result } = renderHook(() => useSequencePlayer({ bpm: 120, instrument, steps }))

    act(() => result.current.play())
    act(() => vi.advanceTimersByTime(500))
    expect(result.current.currentStepIndex).toBe(1)

    act(() => result.current.pause())
    expect(result.current.isPlaying).toBe(false)

    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.currentStepIndex).toBe(1)
  })

  it('resuming after pause continues from the frozen step, not from 0', () => {
    const { result } = renderHook(() => useSequencePlayer({ bpm: 120, instrument, steps }))

    act(() => result.current.play())
    act(() => vi.advanceTimersByTime(500))
    act(() => result.current.pause())
    expect(result.current.currentStepIndex).toBe(1)

    act(() => result.current.play())
    expect(result.current.currentStepIndex).toBe(1)

    act(() => vi.advanceTimersByTime(500))
    expect(result.current.currentStepIndex).toBe(2)
  })

  it('restart seeks back to step 0 without auto-playing when paused', () => {
    const { result } = renderHook(() => useSequencePlayer({ bpm: 120, instrument, steps }))

    act(() => result.current.play())
    act(() => vi.advanceTimersByTime(500))
    act(() => vi.advanceTimersByTime(500))
    expect(result.current.currentStepIndex).toBe(2)

    act(() => result.current.pause())
    act(() => result.current.restart())
    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.isPlaying).toBe(false)
  })

  it('reaching the end of the sequence marks complete and fires onComplete', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useSequencePlayer({ bpm: 120, instrument, onComplete, steps }))

    act(() => result.current.play())
    for (let tick = 0; tick < steps.length; tick += 1) {
      act(() => vi.advanceTimersByTime(500))
    }

    expect(result.current.isComplete).toBe(true)
    expect(result.current.isPlaying).toBe(false)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('resets to step 0 when the steps array changes (switching song/difficulty)', () => {
    const { rerender, result } = renderHook(({ currentSteps }) => useSequencePlayer({ bpm: 120, instrument, steps: currentSteps }), {
      initialProps: { currentSteps: steps },
    })

    act(() => result.current.play())
    act(() => vi.advanceTimersByTime(500))
    expect(result.current.currentStepIndex).toBe(1)

    const otherSteps = [{ beats: 1, measure: 1, notes: [note('A4', 440)], type: 'note' }]
    rerender({ currentSteps: otherSteps })

    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.isPlaying).toBe(false)
  })
})
