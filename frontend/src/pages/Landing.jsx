import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import FeatureCard from '../components/FeatureCard'
import PageHeader from '../components/PageHeader'
import ReflectionCard from '../components/ReflectionCard'
import SectionCard from '../components/SectionCard'
import SongCard from '../components/SongCard'
import { getPublishedSongs } from '../services/publicSongService'
import { getReflections } from '../services/reflectionService'
import { getCommunityStats } from '../services/statsService'

const initialStats = { usersCount: null, songsCount: null, reflectionsCount: null }

function statTitle(value, label) {
  return `${value === null ? '…' : value.toLocaleString()} ${label}`
}

export default function Landing() {
  const [songs, setSongs] = useState([])
  const [reflections, setReflections] = useState([])
  const [stats, setStats] = useState(initialStats)
  const [statsError, setStatsError] = useState('')
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

    getCommunityStats()
      .then((data) => active && setStats(data))
      .catch((nextError) => active && setStatsError(nextError.message))

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
        <FeatureCard description="Registered users exploring Shades of SG." icon="👥" title={statTitle(stats.usersCount, 'Active Explorers')} />
        <FeatureCard description="Published songs available to explore." icon="🎶" title={statTitle(stats.songsCount, 'Heritage Songs')} />
        <FeatureCard description="Community reflections approved and shared." icon="📖" title={statTitle(stats.reflectionsCount, 'Stories Shared')} />
      </div>
      {statsError ? <p className="state-message" role="alert">{statsError}</p> : null}
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
