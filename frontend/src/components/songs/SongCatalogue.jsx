import { Bookmark, Music2, Pause, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import CreatorNameLink from '../CreatorNameLink'
import { highlightMatch } from '../../utils/highlightMatch'

function formatSongDuration(durationSecs) {
  const totalSeconds = Math.floor(Number(durationSecs))
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—'
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function SongArtwork({ song }) {
  return song.coverImageUrl ? (
    <img alt={`${song.title} cover artwork`} src={song.coverImageUrl} />
  ) : (
    <span aria-label={`No cover artwork available for ${song.title}`} className="song-catalogue-art__fallback" role="img">
      <Music2 aria-hidden="true" size={20} />
    </span>
  )
}

export default function SongCatalogue({
  bookmarkPendingIds,
  isAuthenticated,
  onSelect,
  onToggleBookmark,
  playingSongId,
  rhythmBySong,
  searchTerm,
  selectedSongId,
  songs,
  startIndex,
}) {
  return (
    <div aria-label="Song catalogue" className="song-catalogue-list" role="list">
      <div aria-hidden="true" className={`song-catalogue-header${isAuthenticated ? ' has-bookmark' : ''}`}>
        <span>#</span><span>Song / creator</span><span>Theme</span><span>Mood</span>
        <span>Rhythm game</span><span>Duration</span>
        {isAuthenticated ? <span className="song-catalogue-header__bookmark">Bookmark</span> : null}
        <span>Open</span>
      </div>

      {songs.map((song, index) => {
        const isSelected = song.id === selectedSongId
        const isPlaying = song.id === playingSongId
        const rhythmAvailable = (rhythmBySong[song.id] || []).length > 0
        const isBookmarked = Boolean(song.bookmarked)
        const bookmarkPending = bookmarkPendingIds?.has(song.id)

        return (
          <article
            aria-current={isSelected ? 'true' : undefined}
            className={`song-catalogue-row${isSelected ? ' is-selected' : ''}${isPlaying ? ' is-playing' : ''}${isAuthenticated ? ' has-bookmark' : ''}`}
            key={song.id}
            role="listitem"
          >
            <button
              aria-label={`Select ${song.title} preview`}
              className="song-catalogue-row__select"
              onClick={() => onSelect(song.id)}
              onFocus={() => onSelect(song.id, { fromFocus: true })}
              type="button"
            ><span className="sr-only">Select {song.title} preview</span></button>

            <span className="song-catalogue-row__status" title={isPlaying ? 'Preview playing' : undefined}>
              {isPlaying ? <Pause aria-hidden="true" size={16} /> : isSelected ? <Play aria-hidden="true" size={16} /> : startIndex + index + 1}
              {isPlaying ? <span className="sr-only">Playing</span> : null}
            </span>
            <span className="song-catalogue-row__identity">
              <span className="song-catalogue-art"><SongArtwork song={song} /></span>
              <span className="song-catalogue-row__copy">
                <strong>{highlightMatch(song.title, searchTerm)}</strong>
                <CreatorNameLink highlight={searchTerm} song={song} />
              </span>
            </span>
            <span className="song-catalogue-row__theme">{song.theme || '—'}</span>
            <span className="song-catalogue-row__mood">{song.moodTags?.[0] || '—'}</span>
            <span className="song-catalogue-row__rhythm">{rhythmAvailable ? <><Music2 aria-hidden="true" size={14} /> Available</> : '—'}</span>
            <span className="song-catalogue-row__duration">{formatSongDuration(song.durationSecs)}</span>
            {isAuthenticated ? (
              <button
                aria-label={isBookmarked ? `Remove ${song.title} from bookmarks` : `Bookmark ${song.title}`}
                aria-pressed={isBookmarked}
                className={`song-catalogue-row__bookmark${isBookmarked ? ' is-bookmarked' : ''}`}
                disabled={bookmarkPending}
                onClick={() => onToggleBookmark(song.id, !isBookmarked)}
                type="button"
              >
                <Bookmark aria-hidden="true" fill={isBookmarked ? 'currentColor' : 'none'} size={18} />
              </button>
            ) : null}
            <Link aria-label={`Explore song: ${song.title}`} className="song-catalogue-row__open" to={`/songs/${song.id}`}>
              <span aria-hidden="true">›</span>
            </Link>
          </article>
        )
      })}
    </div>
  )
}
