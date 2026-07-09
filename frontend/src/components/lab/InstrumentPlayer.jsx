import { useEffect, useRef, useState } from 'react'
import useInstrumentAudio from '../../hooks/useInstrumentAudio'

const CHALLENGES = [
  {
    id: 'three-notes',
    isComplete: (playedIndexes) => playedIndexes.size >= 3,
    label: 'Play three different notes',
  },
  {
    id: 'lowest-note',
    isComplete: (playedIndexes) => playedIndexes.has(0),
    label: 'Find the lowest note',
  },
  {
    id: 'highest-note',
    isComplete: (playedIndexes, noteCount) => playedIndexes.has(noteCount - 1),
    label: 'Find the highest note',
  },
]

export default function InstrumentPlayer({ instrument, instruments, onBack, onSelectInstrument }) {
  const { playMelody, playNote } = useInstrumentAudio()
  const [activeNoteLabel, setActiveNoteLabel] = useState(null)
  const [playedIndexes, setPlayedIndexes] = useState(() => new Set())
  const [liveMessage, setLiveMessage] = useState(
    () => `${instrument.name} ready. Tap a pad or use your keyboard to play.`
  )
  const activeNoteTimeout = useRef(null)

  useEffect(() => {
    return () => window.clearTimeout(activeNoteTimeout.current)
  }, [])

  function triggerNote(note, index) {
    playNote(instrument, note)
    setActiveNoteLabel(note.label)
    setLiveMessage(`Playing ${note.label}`)
    setPlayedIndexes((current) => {
      const next = new Set(current)
      next.add(index)
      return next
    })

    window.clearTimeout(activeNoteTimeout.current)
    activeNoteTimeout.current = window.setTimeout(() => setActiveNoteLabel(null), 220)
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.repeat) {
        return
      }

      const key = event.key.toLowerCase()
      const matchIndex = instrument.notes.findIndex((note) => note.key === key)

      if (matchIndex === -1) {
        return
      }

      triggerNote(instrument.notes[matchIndex], matchIndex)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrument])

  function handlePreview(previewInstrument) {
    playNote(previewInstrument, previewInstrument.notes[0])
  }

  const otherInstruments = instruments.filter((candidate) => candidate.id !== instrument.id)

  return (
    <section className="lab-player" aria-label={`${instrument.name} interactive player`}>
      <button className="lab-player__back" onClick={onBack} type="button">
        <span aria-hidden="true">←</span> Back to the Gallery
      </button>

      <div className="lab-player__layout">
        <div className="lab-player__stage">
          <div className="lab-player__heading">
            <span className="lab-player__icon" aria-hidden="true">{instrument.icon}</span>
            <div>
              <p className="lab-player__origin">{instrument.origin}</p>
              <h2>{instrument.name}</h2>
            </div>
          </div>

          <div className="lab-keyboard" role="group" aria-label={`${instrument.name} notes`}>
            {instrument.notes.map((note, index) => (
              <button
                aria-label={`Play ${note.label}`}
                className={`lab-key ${activeNoteLabel === note.label ? 'is-active' : ''}`}
                key={note.label}
                onClick={() => triggerNote(note, index)}
                type="button"
              >
                <span className="lab-key__note">{note.label}</span>
                <span className="lab-key__hint" aria-hidden="true">{note.key.toUpperCase()}</span>
              </button>
            ))}
          </div>

          <p aria-live="polite" className="sr-only">{liveMessage}</p>

          <div className="lab-player__actions">
            <button
              className="lab-player__melody"
              onClick={() => playMelody(instrument, instrument.melody)}
              type="button"
            >
              🎧 Hear a Traditional Melody
            </button>
          </div>

          <div className="lab-compare">
            <p className="lab-compare__label">🔍 Compare with another instrument</p>
            <div className="lab-compare__row">
              {otherInstruments.map((candidate) => (
                <button
                  aria-label={`Preview ${candidate.name}`}
                  className="lab-compare__chip"
                  key={candidate.id}
                  onClick={() => handlePreview(candidate)}
                  type="button"
                >
                  <span aria-hidden="true">{candidate.icon}</span>
                  {candidate.name}
                </button>
              ))}
            </div>
            <button
              className="lab-compare__switch"
              onClick={() => onSelectInstrument(otherInstruments[0]?.id)}
              type="button"
            >
              Switch to {otherInstruments[0]?.name} →
            </button>
          </div>

          <div className="lab-challenges">
            <p className="lab-challenges__label">Fun Challenges</p>
            <ul className="lab-challenges__list">
              {CHALLENGES.map((challenge) => {
                const isComplete = challenge.isComplete(playedIndexes, instrument.notes.length)

                return (
                  <li className={`lab-challenge ${isComplete ? 'is-complete' : ''}`} key={challenge.id}>
                    <span aria-hidden="true">{isComplete ? '✅' : '⬜'}</span>
                    {challenge.label}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <aside className="lab-info" aria-label={`About the ${instrument.name}`}>
          <h3>📖 Learn About the {instrument.name}</h3>
          <dl className="lab-info__list">
            <div>
              <dt>Origin</dt>
              <dd>{instrument.facts.origin}</dd>
            </div>
            <div>
              <dt>Role in Performance</dt>
              <dd>{instrument.facts.role}</dd>
            </div>
            <div>
              <dt>Did You Know?</dt>
              <dd>{instrument.facts.historicalFact}</dd>
            </div>
            <div>
              <dt>When It's Played</dt>
              <dd>{instrument.facts.whenPlayed}</dd>
            </div>
            <div>
              <dt>Its Voice in Singapore</dt>
              <dd>{instrument.facts.contribution}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  )
}
