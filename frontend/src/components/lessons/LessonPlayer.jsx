import { useEffect, useState } from 'react'
import LessonKeyboard from './LessonKeyboard'
import SequenceProgress from './SequenceProgress'
import { preloadInstrument } from '../../hooks/useInstrumentAudio'
import useSequencePlayer from '../../hooks/useSequencePlayer'
import useSongProgress from '../../hooks/useSongProgress'

// Stage 4 of the guided lesson flow: first let the learner hear a sample of
// the song at the chosen tempo/instrument (substage 'listen', mirroring the
// old lesson's "Step 1 · Listen" intro), then teach it note by note with a
// tempo-driven Play/Pause/Restart transport (substage 'lesson'). Reaching
// the end of the sequence marks that difficulty complete via
// useSongProgress.
export default function LessonPlayer({ difficultyKey, instrument, onBack, song }) {
  const variant = song.difficulties[difficultyKey]
  const { markDifficultyComplete, progress } = useSongProgress(song.id)
  const [substage, setSubstage] = useState('listen')
import useInstrumentAudio, { preloadInstrument } from '../../hooks/useInstrumentAudio'
import useLabInstruments from '../../hooks/useLabInstruments'
import useLessonProgress from '../../hooks/useLessonProgress'
import LessonSection from './LessonSection'

export default function LessonPlayer({ lesson, onBack }) {
  const instruments = useLabInstruments()
  // Every built lesson's note pool today is a subset of Piano's range —
  // future lessons that want a different voice can look up another
  // instrument here the same way. Falls back to a plain synthesized voice
  // if, somehow, the static instrument list doesn't have it.
  const lessonVoice = instruments.find((instrument) => instrument.id === 'piano')
    || { envelope: 'sustained', waveform: 'triangle' }
  const { playMelody } = useInstrumentAudio()
  const { markSectionComplete, progress, resetProgress } = useLessonProgress(lesson.id)

  useEffect(() => {
    preloadInstrument(lessonVoice)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonVoice.id, lessonVoice.samples])
  const [stage, setStage] = useState(() =>
    progress.completedSections > 0 && progress.completedSections < lesson.sections.length
      ? progress.completedSections
      : 'listen'
  )

  const { currentStepIndex, isComplete, isPlaying, pause, play, restart } = useSequencePlayer({
    bpm: variant.bpm,
    instrument,
    onComplete: () => markDifficultyComplete(difficultyKey),
    steps: variant.steps,
  })

  useEffect(() => {
    preloadInstrument(instrument)
  }, [instrument])

  function handleStartLearning() {
    pause()
    restart()
    setSubstage('lesson')
  }

  function handleReplay() {
    restart()
    play()
  }

  const percentComplete = Math.round((currentStepIndex / variant.steps.length) * 100)
  const meta = `${instrument.name} · ${variant.label} · ${variant.bpm} BPM${variant.isEstimate ? ' (estimated)' : ''} · ${song.keySignature}`

  return (
    <section aria-label={`${song.title} lesson`} className="lesson-player">
      <button className="lesson-player__back" onClick={onBack} type="button">
        <span aria-hidden="true">←</span> Back to Difficulty
      </button>

      <div className="lesson-player__stage">
        {!isComplete && (
          <p className="lesson-listen__eyebrow">{substage === 'listen' ? 'Step 1 · Listen' : 'Step 2 · Learn'}</p>
        )}
        <h2>{song.title}</h2>
        <p className="lesson-listen__description">{meta}</p>

        {!isComplete && substage === 'listen' && (
          <div className="lesson-listen">
            <p className="lesson-listen__description">{song.description}</p>
            <button
              className="lesson-transport__button"
              onClick={isPlaying ? pause : play}
              type="button"
            >
              {isPlaying ? '⏸ Pause Sample' : '▶ Play Sample'}
            </button>
            <p className="lesson-listen__hint">Listen as many times as you like before you start learning it.</p>
            <button className="lesson-transport__button lesson-transport__button--secondary" onClick={handleStartLearning} type="button">
              Start Learning the Notes <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {!isComplete && substage === 'lesson' && (
          <>
            <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentComplete}>
              <span style={{ width: `${percentComplete}%` }} />
            </div>

            <div className="lesson-transport">
              {isPlaying ? (
                <button className="lesson-transport__button" onClick={pause} type="button">
                  ⏸ Pause
                </button>
              ) : (
                <button className="lesson-transport__button" onClick={play} type="button">
                  ▶ Play
                </button>
              )}
              <button className="lesson-transport__button lesson-transport__button--secondary" onClick={restart} type="button">
                ↺ Restart
              </button>
            </div>

            <LessonKeyboard instrument={instrument} steps={variant.steps} />

            <SequenceProgress currentStepIndex={currentStepIndex} steps={variant.steps} />

            <div className="lesson-insight">
              <p className="lesson-insight__prompt">
                <span aria-hidden="true">💡</span> Practice Tips
              </p>
              {variant.practiceTips.map((tip) => (
                <p className="lesson-insight__explanation" key={tip}>{tip}</p>
              ))}
            </div>
          </>
        )}

        {isComplete && (
          <div className="lesson-complete">
            <p aria-hidden="true" className="lesson-complete__emoji">🎉</p>
            <h2>Lesson Complete!</h2>
            <p>
              You have played through {song.title} on {variant.label} difficulty.
              {progress.easy?.isComplete && progress.medium?.isComplete && progress.hard?.isComplete
                ? ' You have completed every difficulty for this song!'
                : ''}
            </p>

            <div className="lesson-complete__actions">
              <button className="lesson-complete__primary" onClick={handleReplay} type="button">
                Replay Lesson
              </button>
              <button className="lesson-complete__secondary" onClick={onBack} type="button">
                Try Another Difficulty
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
