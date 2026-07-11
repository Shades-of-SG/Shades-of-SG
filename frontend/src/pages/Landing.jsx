import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import SongCard from '../components/SongCard'
import { getPublishedSongs } from '../services/publicSongService'

export default function Landing() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getPublishedSongs().then((data) => active && setSongs(data.slice(0, 3)))
      .catch((nextError) => active && setError(nextError.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])
  return <div className="page-stack landing-page">
    <section className="hero-panel"><PageHeader description="Explore Singapore stories through published songs, cultural learning, rhythm, and shared memories." eyebrow="Public Experience" title="Shades of SG" /><div className="hero-actions"><Link className="primary-link" to="/songs">Browse Songs</Link><Link className="secondary-link" to="/rhythm-game">Play Rhythm Game</Link></div></section>
    <section className="content-section"><h2>Featured Songs</h2>{loading ? <p role="status">Loading featured songs…</p> : null}{error ? <div className="state-box" role="alert">{error}</div> : null}{!loading && !error && songs.length === 0 ? <EmptyState description="Published songs will appear here." title="No featured songs yet" /> : null}<div className="responsive-grid">{songs.map((song) => <SongCard key={song.id} song={song} />)}</div></section>
    <section className="content-section two-column"><SectionCard title="Why Shades of SG" description="A shared base for music-led cultural discovery."><p>Begin with a published song and continue into its connected learning activities.</p></SectionCard><SectionCard title="Continue Exploring" description="Follow a real song into its cultural and interactive experiences."><Link className="inline-link" to="/learning">Open Learning Hub</Link></SectionCard></section>
  </div>
}
