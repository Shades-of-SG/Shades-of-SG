import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { getPublishedSong } from '../services/publicSongService'

export default function SongExperience() {
  const { id } = useParams()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getPublishedSong(id).then((data) => active && setSong(data)).catch((nextError) => active && setError(nextError.message)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])
  if (loading) return <div className="page-stack"><p role="status">Loading published song…</p></div>
  if (error || !song) return <div className="page-stack"><div className="state-box" role="alert">{error || 'Published song not found.'}</div><Link to="/songs">Back to Songs</Link></div>
  return <div className="page-stack">
    <PageHeader description={song.description || 'No description is available for this song.'} eyebrow="Song Experience" title={song.title} />
    <section className="song-experience-grid">
      <SectionCard title="Song Media">{song.videoUrl ? <video className="video-frame" controls playsInline poster={song.coverImageUrl || undefined} src={song.videoUrl} /> : song.coverImageUrl ? <img alt={`${song.title} cover`} className="video-frame" src={song.coverImageUrl} /> : <p>Video and cover media are unavailable.</p>}</SectionCard>
      <SectionCard title="Song Metadata"><dl className="detail-list"><div><dt>Artist</dt><dd>{song.artist || 'Unavailable'}</dd></div><div><dt>Theme</dt><dd>{song.theme || 'Unavailable'}</dd></div><div><dt>Languages</dt><dd>{(song.languages || []).join(', ') || 'Unavailable'}</dd></div></dl></SectionCard>
      <SectionCard title="Cultural Summary"><p>{song.description || 'A cultural summary is not available.'}</p></SectionCard>
      <SectionCard title="Explore This Song"><div className="button-row"><Link className="inline-link" to={`/songs/${id}/playground`}>Open Playground</Link><Link className="inline-link" to={`/songs/${id}/trivia`}>Start Trivia</Link><Link className="inline-link" to={`/game/${id}`}>Play Rhythm</Link></div></SectionCard>
    </section>
  </div>
}
