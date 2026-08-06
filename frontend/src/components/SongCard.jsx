import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import CreatorNameLink from './CreatorNameLink'

function SongArtwork({ song }) {
  return song.coverImageUrl ? (
    <img
      alt={`${song.title} cover`}
      className="song-art song-art--image"
      src={song.coverImageUrl}
    />
  ) : (
    <div aria-label="No cover image" className="song-art song-art--fallback">
      No cover
    </div>
  )
}

export default function SongCard({ song, variant = 'default' }) {
  if (variant === 'library') {
    const tags = [
      ...(song.languages || []).map((value) => ({ label: value, type: 'language' })),
      ...(song.moodTags || []).map((value) => ({ label: value, type: 'mood' })),
    ].slice(0, 4)

    return (
      <article className="song-card song-card--library">
        <Link
          aria-label={`Explore song: ${song.title}`}
          className="song-card__full-link"
          to={`/songs/${song.id}`}
        >
          <span className="song-card__artwork"><SongArtwork song={song} /></span>
          <span className="song-card__body">
            {song.theme && <span className="eyebrow">{song.theme}</span>}
            <span className="song-card__title">{song.title}</span>
            {song.artist && <span className="song-card__artist">{song.artist}</span>}
            {song.description && <span className="song-card__description">{song.description}</span>}
            {tags.length > 0 ? (
              <span className="song-card__tags" aria-label="Song tags">
                {tags.map((tag) => (
                  <span className={`song-tag song-tag--${tag.type}`} key={`${tag.type}-${tag.label}`}>
                    {tag.label}
                  </span>
                ))}
              </span>
            ) : null}
          </span>
          <span className="song-card__action">
            <ArrowRight aria-hidden="true" size={16} />
          </span>
        </Link>
      </article>
    )
  }

  return (
    <article className="song-card">
      <SongArtwork song={song} />
      <div>
        {song.theme && <p className="eyebrow">{song.theme}</p>}
        <h3>{song.title}</h3>
        <p><strong>Artist:</strong> {song.artist ? <CreatorNameLink className="song-card__artist" song={song} /> : 'Unknown'}</p>
        <p className="song-card-description"><strong>Description:</strong> {song.description || 'No description available.'}</p>
        <p><strong>Language(s):</strong> {song.languages?.length > 0 ? song.languages.join(', ') : 'Not specified'}</p>
      </div>
      <Link className="song-card__action" to={`/songs/${song.id}`}>
        Explore Song
      </Link>
    </article>
  )
}
