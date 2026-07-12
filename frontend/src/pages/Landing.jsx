import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import FeatureCard from '../components/FeatureCard'
import PageHeader from '../components/PageHeader'
import ReflectionCard from '../components/ReflectionCard'
import SectionCard from '../components/SectionCard'
import SongCard from '../components/SongCard'
import { API_URL } from '../services/apiConfig'
import { getPublishedSongs } from '../services/publicSongService'
import { getReflections } from '../services/reflectionService'

const initialStats = { usersCount: 0, songsCount: 0, reflectionsCount: 0 }

export default function Landing() {
  const [songs, setSongs] = useState([])
  const [reflections, setReflections] = useState([])
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([getPublishedSongs(), getReflections()])
      .then(([nextSongs, nextReflections]) => {
        if (!active) return
        setSongs(nextSongs.slice(0, 3))
        setReflections(nextReflections.slice(0, 3))
      })
      .catch((nextError) => active && setError(nextError.message))
      .finally(() => active && setLoading(false))

    fetch(`${API_URL}/stats`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Unable to load community statistics.')
        return data
      })
      .then((data) => active && setStats({ ...initialStats, ...data }))
      .catch(() => {})

    return () => { active = false }
  }, [])

  return <div className="page-stack landing-page">
    <section className="hero-panel">
      <PageHeader description="Explore Singapore stories through published songs, cultural learning, rhythm, and shared memories." eyebrow="Public Experience" title="Shades of SG" />
      <div className="hero-actions"><Link className="primary-link" to="/songs">Browse Songs</Link><Link className="secondary-link" to="/rhythm-game">Play Rhythm Game</Link></div>
    </section>

    <section className="content-section">
      <h2>What you can do</h2>
      <div className="feature-row">
        <FeatureCard description="Enjoy music videos with stories and cultural insights." icon="🎥" title="Watch & Learn" />
        <FeatureCard description="Explore traditional instruments through playful activities." icon="🎹" title="Play Instruments" />
        <FeatureCard description="Test your timing, beat your high score, and earn points." icon="🥁" title="Rhythm Challenges" />
        <FeatureCard description="Share memories and read stories from the community." icon="📝" title="Share & Reflect" />
      </div>
      <div className="feature-row stats-row" aria-label="Community statistics">
        <FeatureCard description="Registered users exploring Shades of SG." icon="👥" title={`${stats.usersCount} Active Explorers`} />
        <FeatureCard description="Published songs available to explore." icon="🎶" title={`${stats.songsCount} Heritage Songs`} />
        <FeatureCard description="Community reflections approved and shared." icon="📖" title={`${stats.reflectionsCount} Stories Shared`} />
      </div>
    </section>

    <section className="content-section">
      <h2>Featured Songs</h2>
      {loading ? <p role="status">Loading featured stories…</p> : null}
      {error ? <div className="state-box" role="alert">{error}</div> : null}
      {!loading && !error && songs.length === 0 ? <EmptyState description="Published songs will appear here." title="No featured songs yet" /> : null}
      <div className="responsive-grid">{songs.map((song) => <SongCard key={song.id} song={song} />)}</div>
      {songs.length > 0 ? <Link className="inline-link" to="/songs">View all songs →</Link> : null}
    </section>

    {!loading && !error && reflections.length > 0 ? <section className="content-section">
      <h2>Featured Reflections</h2>
      <div className="landing-reflections">{reflections.map((reflection) => <ReflectionCard key={reflection.id} reflection={reflection} />)}</div>
      <Link className="inline-link" to="/reflections">View all reflections →</Link>
    </section> : null}

    <section className="content-section two-column">
      <SectionCard title="Why Shades of SG" description="A shared base for music-led cultural discovery."><p>Begin with a published song and continue into its connected learning activities.</p></SectionCard>
      <SectionCard title="Continue Exploring" description="Follow a real song into its cultural and interactive experiences."><Link className="inline-link" to="/learning">Open Learning Hub</Link></SectionCard>
    </section>
  </div>
}
