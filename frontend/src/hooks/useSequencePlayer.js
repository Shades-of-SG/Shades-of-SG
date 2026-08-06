import { useCallback, useEffect, useRef, useState } from 'react'
import useInstrumentAudio from './useInstrumentAudio'
import { getStepDurationMs } from '../utils/songTiming'

/*
Drives BPM-timed Play/Pause/Restart playback through a song difficulty's
`steps` array on a chosen instrument. This owns transport *state* only —
the actual sound comes from useInstrumentAudio's playNote(), which stays
unchanged.

Note: this deliberately calls playNote() once per note in a step rather
than useInstrumentAudio's playChord(), even for chord steps. playChord()
looks each label up in the *instrument's own* `notes` list — which is fine
for the Lab's own melodies, but a song step's notes (data/songs.js) are
self-contained { label, frequency } objects that intentionally may not
appear in a given instrument's note list at all (piano has no F#4, for
example). playNote() only ever needs a note's own label/frequency, so
calling it directly is what makes every song play correctly on every
instrument.

Playback is entirely state-driven: an effect keyed on [isPlaying,
currentStepIndex] plays the current step's notes and schedules a single
setTimeout to advance currentStepIndex once that step's BPM-derived
duration elapses. Pausing (isPlaying -> false) or moving to a different
step cancels that pending timeout via the effect's cleanup function —
that's what makes pause "freeze in place" (the frozen step stays put, no
further notes fire) rather than just stop future advances, and what makes
resuming continue from that same step rather than restarting from 0.
*/
export default function useSequencePlayer({ bpm, instrument, onComplete, steps }) {
  const { playNote } = useInstrumentAudio()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // A different song/difficulty (a new `steps` array) invalidates any
  // in-flight playback — reset to the top rather than continuing to play
  // the previous sequence. This is the React-recommended "adjust state
  // during render when a prop changes" pattern rather than an effect, so
  // the reset happens before this render paints instead of after.
  const [trackedSteps, setTrackedSteps] = useState(steps)
  if (trackedSteps !== steps) {
    setTrackedSteps(steps)
    setCurrentStepIndex(0)
    setIsPlaying(false)
    setIsComplete(false)
  }

  // onComplete is typically a fresh inline function on every render of the
  // caller — kept in a ref (updated in its own effect, never during render)
  // so the scheduling effect below doesn't need it as a dependency and
  // doesn't re-fire notes just because the caller re-rendered.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return

    const step = steps[currentStepIndex]
    step.notes.forEach((stepNote) => playNote(instrument, stepNote))

    const durationMs = getStepDurationMs(step, bpm)
    const timeoutId = setTimeout(() => {
      const nextIndex = currentStepIndex + 1
      if (nextIndex >= steps.length) {
        setIsPlaying(false)
        setIsComplete(true)
        onCompleteRef.current?.()
        return
      }

      setCurrentStepIndex(nextIndex)
    }, durationMs)

    return () => clearTimeout(timeoutId)
  }, [isPlaying, currentStepIndex, steps, bpm, instrument, playNote])

  const play = useCallback(() => {
    if (steps.length > 0) setIsPlaying(true)
  }, [steps])

  const pause = useCallback(() => setIsPlaying(false), [])

  // Seeks back to the first step. If playback was already running, the
  // effect above sees currentStepIndex change and immediately plays from
  // the top; if it was paused (or had just finished), it stays paused
  // there — call play() afterwards for an explicit "listen again".
  const restart = useCallback(() => {
    setCurrentStepIndex(0)
    setIsComplete(false)
  }, [])

  return { currentStepIndex, isComplete, isPlaying, pause, play, restart }
}
