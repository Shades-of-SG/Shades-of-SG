import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { getPublishedSong } from '../services/publicSongService'

export default function InstrumentPlayground() {
  const { id } = useParams()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getPublishedSong(id).then((data) => active && setSong(data)).catch((nextError) => active && setError(nextError.message)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])
  if (loading) return <div className="page-stack"><p role="status">Loading song playground…</p></div>
  if (error || !song) return <div className="page-stack"><div className="state-box" role="alert">{error || 'Published song not found.'}</div><Link to="/songs">Choose another song</Link></div>
  return <div className="page-stack"><PageHeader description={`Instrument activities connected to ${song.title}.`} eyebrow="Instrument Playground" title={`${song.title} Playground`} /><section className="three-column"><SectionCard title="Instruments unavailable"><p>No instruments have been linked to this published Song yet.</p></SectionCard><SectionCard title="Song Context"><p>{song.artist || 'Artist unavailable'}</p><p>{song.theme || 'Theme unavailable'} · {(song.languages || []).join(', ') || 'Language unavailable'}</p></SectionCard><SectionCard title="Continue"><Link className="inline-link" to={`/songs/${song.id}`}>Back to Song Experience</Link></SectionCard></section></div>
}
