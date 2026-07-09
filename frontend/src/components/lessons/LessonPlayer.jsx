import { useState } from 'react'
import useInstrumentAudio from '../../hooks/useInstrumentAudio'
import useLessonProgress from '../../hooks/useLessonProgress'
import LessonSection from './LessonSection'

const lessonVoice = {
  envelope: 'sustained',
  waveform: 'triangle',
}

export default function LessonPlayer({ lesson, onBack }) {
  const { playMelody } = useInstrumentAudio()
  const { markSectionComplete, progress, resetProgress } = useLessonProgress(lesson.id)
  const [stage, setStage] = useState(() =>
    progress.completedSections > 0 && progress.completedSections < lesson.sections.length
      ? progress.completedSections
      : 'listen'
  )

  const fullSequence = lesson.sections.flatMap((section) => section.sequence)

  function handlePlayFullSong() {
    playMelody(lessonVoice, fullSequence)
  }

  function handleSectionComplete(index) {
    markSectionComplete(index, lesson.sections.length)
  }

  function handleContinueFromSection(index) {
    if (index + 1 >= lesson.sections.length) {
      setStage('complete')
      return
    }

    setStage(index + 1)
  }

  function handleReplay() {
    resetProgress()
    setStage('listen')
  }

  return (
    <section className="lesson-player" aria-label={`${lesson.title} lesson`}>
      <button className="lesson-player__back" onClick={onBack} type="button">
        <span aria-hidden="true">←</span> Back to the Lesson Library
      </button>

      <div className="lesson-player__stage">
        {stage === 'listen' && (
          <div className="lesson-listen">
            <p className="lesson-listen__eyebrow">Step 1 · Listen</p>
            <h2>{lesson.title}</h2>
            <p className="lesson-listen__description">{lesson.description}</p>
            <button className="lesson-listen__play" onClick={handlePlayFullSong} type="button">
              ▶ Play Full Song
            </button>
            <p className="lesson-listen__hint">Replay as many times as you like before continuing.</p>
            <button className="lesson-listen__continue" onClick={() => setStage(0)} type="button">
              Start Learning Sections
            </button>
          </div>
        )}

        {typeof stage === 'number' && (
          <LessonSection
            index={stage}
            key={stage}
            onSectionComplete={handleSectionComplete}
            section={lesson.sections[stage]}
            voice={lessonVoice}
          />
        )}

        {typeof stage === 'number' && progress.completedSections > stage && (
          <button
            className="lesson-section__continue"
            onClick={() => handleContinueFromSection(stage)}
            type="button"
          >
            Continue <span aria-hidden="true">→</span>
          </button>
        )}

        {stage === 'complete' && (
          <div className="lesson-complete">
            <p className="lesson-complete__emoji" aria-hidden="true">🎉</p>
            <h2>Lesson Complete!</h2>
            <p>You've learned another piece of Singapore's musical heritage.</p>

            <div className="lesson-complete__actions">
              <button className="lesson-complete__primary" onClick={handleReplay} type="button">
                Replay Lesson
              </button>
              <button className="lesson-complete__secondary" onClick={onBack} type="button">
                Return to Lesson Library
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
