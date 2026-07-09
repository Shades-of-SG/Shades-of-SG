import { useState } from 'react'
import useInstrumentAudio from '../../hooks/useInstrumentAudio'

const POSITIVE_MESSAGES = ['✓ Great job!', 'Nice one!', "You've got it!"]
const GENTLE_MESSAGES = [
  'Almost there! Try that note again.',
  'So close — give the highlighted note a try.',
  'Not quite — have another go.',
]

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export default function LessonSection({ index, onSectionComplete, section, voice }) {
  const { playChord, playMelody, playNote } = useInstrumentAudio()
  const [subStage, setSubStage] = useState('learn')
  const [attemptIndex, setAttemptIndex] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [lastPressed, setLastPressed] = useState(null)

  const targetLabel = section.sequence[attemptIndex]

  function handleListenDemo() {
    playMelody(voice, section.sequence)
  }

  function handleInsightDemo() {
    if (section.insight.chord) {
      playChord(voice, section.insight.chord)
    } else {
      playMelody(voice, section.insight.demoSequence)
    }
  }

  function handlePress(note) {
    playNote(voice, note)
    setLastPressed(note.label)
    window.setTimeout(() => setLastPressed(null), 200)

    if (note.label === targetLabel) {
      const nextAttemptIndex = attemptIndex + 1
      setFeedback(pickRandom(POSITIVE_MESSAGES))

      if (nextAttemptIndex >= section.sequence.length) {
        setSubStage('passed')
        onSectionComplete(index)
        return
      }

      setAttemptIndex(nextAttemptIndex)
      return
    }

    setFeedback(pickRandom(GENTLE_MESSAGES))
  }

  return (
    <div className="lesson-section">
      <p className="lesson-section__eyebrow">Section {index + 1}</p>
      <h3>{section.title}</h3>

      {subStage === 'learn' && (
        <div className="lesson-section__learn">
          <button className="lesson-section__demo" onClick={handleListenDemo} type="button">
            ▶ Hear This Phrase
          </button>

          <div className="lesson-phrase" aria-label="Phrase note order">
            {section.sequence.map((label, sequenceIndex) => (
              <span className="lesson-phrase__note" key={`${label}-${sequenceIndex}`}>{label}</span>
            ))}
          </div>

          {section.insight && (
            <div className="lesson-insight">
              <p className="lesson-insight__prompt">
                <span aria-hidden="true">{section.insight.icon}</span> {section.insight.prompt}
              </p>
              <p className="lesson-insight__explanation">{section.insight.explanation}</p>
              <button className="lesson-insight__demo" onClick={handleInsightDemo} type="button">
                🔊 Hear It
              </button>
            </div>
          )}

          <button className="lesson-section__ready" onClick={() => setSubStage('practice')} type="button">
            I'm Ready to Practice
          </button>
        </div>
      )}

      {subStage === 'practice' && (
        <div className="lesson-section__practice">
          <p className="lesson-section__instruction">Play the highlighted note to continue the phrase.</p>

          <div className="lesson-keyboard" role="group" aria-label={`${section.title} keyboard`}>
            {section.notes.map((note) => (
              <button
                aria-label={`Play ${note.label}`}
                className={`lesson-key ${note.label === targetLabel ? 'is-target' : ''} ${lastPressed === note.label ? 'is-pressed' : ''}`}
                key={note.label}
                onClick={() => handlePress(note)}
                type="button"
              >
                {note.label}
              </button>
            ))}
          </div>

          <p aria-live="polite" className="lesson-section__feedback">{feedback}</p>
        </div>
      )}

      {subStage === 'passed' && (
        <div className="lesson-section__passed">
          <p className="lesson-section__feedback is-success">✓ Great job! Let's move to the next phrase.</p>
          <button className="lesson-section__demo" onClick={handleListenDemo} type="button">
            🎧 Hear the Original Again
          </button>
        </div>
      )}
    </div>
  )
}
