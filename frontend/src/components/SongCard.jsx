import { Link } from 'react-router-dom'

export default function SongCard({ song }) {
  return (
    <article className="song-card">
      {song.coverImageUrl
        ? <img alt={`${song.title} cover`} className="song-art song-art--image" src={song.coverImageUrl} />
        : <div aria-label="No cover image" className="song-art song-art--fallback">No cover</div>}
      <div>
        {song.theme && <p className="eyebrow">{song.theme}</p>}
        <h3>{song.title}</h3>
        <p><strong>Artist:</strong> {song.artist || 'Unknown'}</p>
        <p className="song-card-description"><strong>Description:</strong> {song.description || 'No description available.'}</p>
        <p><strong>Language(s):</strong> {song.languages?.length > 0 ? song.languages.join(', ') : 'Not specified'}</p>
      </div>
      <Link to={`/songs/${song.id}`}>Explore Song</Link>
    </article>
  )
}
