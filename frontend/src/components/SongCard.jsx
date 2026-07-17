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
        {song.artist && <p>{song.artist}</p>}
        {song.description && <p>{song.description}</p>}
        {song.languages?.length > 0 && <p>{song.languages.join(', ')}</p>}
      </div>
      <Link to={`/songs/${song.id}`}>Explore Song</Link>
    </article>
  )
}
