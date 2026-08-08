import useSongProgress from '../../hooks/useSongProgress'

const DIFFICULTY_KEYS = ['easy', 'medium', 'hard']

// Stage 2 of the guided lesson flow. Unlike the old LessonCard, a song here
// never has a single fixed difficulty or a locked "coming soon" state —
// every song in data/songs.js has all three difficulty tiers, so this card
// is purely about picking the song; difficulty comes next.
export default function SongCard({ onSelect, song }) {
  const { progress } = useSongProgress(song.id)
  const completedCount = DIFFICULTY_KEYS.filter((key) => progress[key]?.isComplete).length

  return (
    <article className="song-card">
      <div aria-hidden="true" className="song-card__art">
        <span>{song.icon}</span>
      </div>

      <div className="song-card__body">
        <span className="song-card__subtitle">{song.subtitle}</span>
        <h3>{song.title}</h3>
        <p className="song-card__description">{song.description}</p>
      </div>

      <div aria-label="Difficulty completion" className="song-card__difficulties" role="list">
        {DIFFICULTY_KEYS.map((key) => {
          const isComplete = Boolean(progress[key]?.isComplete)
          return (
            <span
              className={`song-card__difficulty-pill ${isComplete ? 'is-complete' : ''}`}
              key={key}
              role="listitem"
            >
              {isComplete ? '✓ ' : ''}
              {song.difficulties[key].label}
            </span>
          )
        })}
      </div>

      <button className="song-card__cta" onClick={() => onSelect(song.id)} type="button">
        {completedCount > 0 ? 'Continue Learning' : 'Choose This Song'}
      </button>
    </article>
  )
}
