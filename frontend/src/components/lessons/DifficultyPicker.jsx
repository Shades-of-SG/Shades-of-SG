import useSongProgress from '../../hooks/useSongProgress'
import { formatDuration, getSequenceDurationMs } from '../../utils/songTiming'

const DIFFICULTY_KEYS = ['easy', 'medium', 'hard']

// Stage 3 of the guided lesson flow: pick which difficulty tier of the
// chosen song to play. Difficulty determines which steps get shown to the
// player — easy = simplified melody, medium = same melody with a harder
// rhythm, hard = same melody with chords (see data/songs.js).
export default function DifficultyPicker({ onBack, onSelect, song }) {
  const { progress } = useSongProgress(song.id)

  return (
    <section aria-label={`Choose a difficulty for ${song.title}`} className="lesson-difficulty-picker">
      <button className="lesson-player__back" onClick={onBack} type="button">
        <span aria-hidden="true">←</span> Back to Song Library
      </button>

      <div className="learning-section-heading">
        <h2>{song.title}</h2>
        <p>Pick a difficulty to begin — you can always come back and try another.</p>
      </div>

      <div className="lesson-difficulty-picker__grid">
        {DIFFICULTY_KEYS.map((key) => {
          const variant = song.difficulties[key]
          const durationMs = getSequenceDurationMs(variant.steps, variant.bpm)
          const isComplete = Boolean(progress[key]?.isComplete)

          return (
            <article className={`lesson-difficulty-card lesson-difficulty-card--${key}`} key={key}>
              <span className="lesson-difficulty-card__label">{variant.label}</span>
              <p className="lesson-difficulty-card__meta">
                {variant.bpm} BPM{variant.isEstimate ? ' (estimated)' : ''} · ~{formatDuration(durationMs)}
              </p>
              <button className="lesson-difficulty-card__cta" onClick={() => onSelect(key)} type="button">
                {isComplete ? '✓ Replay' : 'Start'}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
