import { Link } from 'react-router-dom'

export default function SongCard({ song }) {
  return (
    <article className="song-card">
      {song.coverImageUrl
        ? <img alt={`${song.title} cover`} className="song-art song-art--image" src={song.coverImageUrl} />
        : <div aria-label="No cover image" className="song-art song-art--fallback">No cover</div>}
      <div>
        <p className="eyebrow">{song.theme}</p>
        <h3>{song.title}</h3>
        <p>{song.artist || 'Artist not listed'}</p>
        <p>{song.description}</p>
        <p>{(song.languages || []).join(', ') || 'Language not listed'}</p>
      </div>
      <Link to={`/songs/${song.id}`}>Explore Song</Link>
    </article>
  )
}
