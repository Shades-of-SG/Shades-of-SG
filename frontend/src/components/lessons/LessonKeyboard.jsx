import { useEffect, useMemo, useRef, useState } from 'react'
import useInstrumentAudio from '../../hooks/useInstrumentAudio'

// Enough single-character keys to cover every note any lesson difficulty
// currently uses (max observed across data/songs.js: 11) with room to
// spare as more songs are added.
const KEYBOARD_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', 'w', 'e', 'r', 't', 'y', 'u']

// Builds the free-play keyboard's note set from the notes this difficulty
// actually uses (deduped by label, low to high) — not the chosen
// instrument's own fixed note list — so every sharp/flat the song calls
// for (e.g. F#4) is always playable here, even on instruments like piano
// or angklung whose own scale has no sharps at all.
function useKeyboardNotes(steps) {
  return useMemo(() => {
    const byLabel = new Map()
    steps.forEach((step) => step.notes.forEach((note) => {
      if (!byLabel.has(note.label)) byLabel.set(note.label, note)
    }))

    return [...byLabel.values()]
      .sort((a, b) => a.frequency - b.frequency)
      .map((note, index) => ({ ...note, key: KEYBOARD_KEYS[index] }))
  }, [steps])
}

// A free-play keyboard for this lesson's notes: click a key, or press the
// matching letter on a physical keyboard, to hear that note on the chosen
// instrument. Mirrors the Instrument Discovery Lab's key-binding pattern
// (components/lab/InstrumentPlayer.jsx's triggerNote/keydown handling) so
// the same muscle memory carries over between the two features — this is a
// deliberately simpler version with no melody/challenge tracking, just
// "try the notes yourself" alongside the guided playback.
export default function LessonKeyboard({ instrument, steps }) {
  const { playNote } = useInstrumentAudio()
  const notes = useKeyboardNotes(steps)
  const [activeNoteLabel, setActiveNoteLabel] = useState(null)
  const activeNoteTimeout = useRef(null)

  useEffect(() => () => window.clearTimeout(activeNoteTimeout.current), [])

  function triggerNote(note) {
    playNote(instrument, note)
    setActiveNoteLabel(note.label)
    window.clearTimeout(activeNoteTimeout.current)
    activeNoteTimeout.current = window.setTimeout(() => setActiveNoteLabel(null), 220)
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.repeat) return

      const key = event.key.toLowerCase()
      const note = notes.find((candidate) => candidate.key === key)
      if (note) triggerNote(note)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  return (
    <div className="lesson-keyboard-practice">
      <p className="lesson-keyboard-practice__label">🎹 Try it yourself — click a key or press its letter</p>
      <div aria-label={`${instrument.name} notes for this lesson`} className="lab-keyboard" role="group">
        {notes.map((note) => (
          <button
            aria-label={`Play ${note.label}`}
            className={`lab-key ${note.label.includes('#') ? 'lab-key--sharp' : ''} ${activeNoteLabel === note.label ? 'is-active' : ''}`}
            key={note.label}
            onClick={() => triggerNote(note)}
            type="button"
          >
            <span className="lab-key__note">{note.label}</span>
            <span aria-hidden="true" className="lab-key__hint">{note.key?.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
