import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { getPublishedSong } from '../services/publicSongService'

export default function TriviaHub() {
  const { id } = useParams()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getPublishedSong(id).then((data) => active && setSong(data)).catch((nextError) => active && setError(nextError.message)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])
  if (loading) return <div className="page-stack"><p role="status">Loading song trivia…</p></div>
  if (error || !song) return <div className="page-stack"><div className="state-box" role="alert">{error || 'Published song not found.'}</div><Link to="/songs">Choose another song</Link></div>
  return <div className="page-stack"><PageHeader description={`Trivia for ${song.title} by ${song.artist || 'an unlisted artist'}.`} eyebrow="Trivia" title={`${song.title} Trivia`} /><section className="three-column"><SectionCard title="Questions unavailable"><p>No published trivia questions are available for this Song yet.</p></SectionCard><SectionCard title="Song Context"><p>{song.description || 'No description is available.'}</p><p>{song.theme || 'Theme unavailable'} · {(song.languages || []).join(', ') || 'Language unavailable'}</p></SectionCard><SectionCard title="Continue"><Link className="inline-link" to={`/songs/${song.id}`}>Back to Song Experience</Link></SectionCard></section></div>
}
