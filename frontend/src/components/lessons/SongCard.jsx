import { Check, Flag, Home, Mountain, Music2, Sparkles, Sun, Users } from 'lucide-react'
import useSongProgress from '../../hooks/useSongProgress'

const DIFFICULTY_KEYS = ['easy', 'medium', 'hard']

const SONG_ICONS = {
  'count-on-me': Users,
  'giants-2026': Mountain,
  home: Home,
  'our-singapore': Flag,
  'stand-up-for-singapore': Music2,
  'tomorrows-here-today': Sun,
  'youll-be-okay': Sparkles,
}

// Stage 2 of the guided lesson flow. Unlike the old LessonCard, a song here
// never has a single fixed difficulty or a locked "coming soon" state —
// every song in data/songs.js has all three difficulty tiers, so this card
// is purely about picking the song; difficulty comes next.
export default function SongCard({ onSelect, song }) {
  const { progress } = useSongProgress(song.id)
  const completedCount = DIFFICULTY_KEYS.filter((key) => progress[key]?.isComplete).length
  const SongIcon = SONG_ICONS[song.id] || Music2

  return (
    <article className="song-card">
      <div aria-hidden="true" className="song-card__art">
        <span><SongIcon size={32} /></span>
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
              {isComplete ? <Check aria-hidden="true" size={14} /> : null}
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
