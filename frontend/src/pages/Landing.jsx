import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BadgeShelf from '../components/BadgeShelf'
import Carousel from '../components/Carousel'
import EmptyState from '../components/EmptyState'
import FeatureCard from '../components/FeatureCard'
import PageHeader from '../components/PageHeader'
import ReflectionCard from '../components/ReflectionCard'
import RhythmStatCard from '../components/RhythmStatCard'
import SectionCard from '../components/SectionCard'
import SongCard from '../components/SongCard'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'
import { getUserBadges } from '../services/badgeService'
import { getPublishedSongs } from '../services/publicSongService'
import { getReflections } from '../services/reflectionService'
import { getMyBestScores } from '../services/scoreService'
import { getCommunityStats, getMyStats } from '../services/statsService'

const initialCommunityStats = { usersCount: 0, songsCount: 0, reflectionsCount: 0 }
const initialUserStats = { badgesCount: 0, triviaAttemptsCount: 0, gamePlaysCount: 0 }

export default function Landing() {
  const { user, token } = useAuth()
  const [songs, setSongs] = useState([])
  const [reflections, setReflections] = useState([])
  const [communityStats, setCommunityStats] = useState(initialCommunityStats)
  const [userStats, setUserStats] = useState(initialUserStats)
  const [badges, setBadges] = useState(null)
  const [bestScores, setBestScores] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([getPublishedSongs(), getReflections()])
      .then(([nextSongs, nextReflections]) => {
        if (!active) return
        setSongs(nextSongs.slice(0, 5))
        setReflections(nextReflections.slice(0, 5))
      })
      .catch((nextError) => active && setError(nextError.message))
      .finally(() => active && setLoading(false))

    getCommunityStats()
      .then((data) => active && setCommunityStats({ ...initialCommunityStats, ...data }))
      .catch(() => {})

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user || !token) return undefined
    let active = true

    getMyStats(token)
      .then((data) => active && setUserStats({ ...initialUserStats, ...data }))
      .catch(() => {})

    getUserBadges(user.id, token)
      .then((data) => active && setBadges(data.slice(0, 3)))
      .catch(() => active && setBadges([]))

    getMyBestScores(token)
      .then((data) => active && setBestScores(data))
      .catch(() => active && setBestScores(null))

    return () => { active = false }
  }, [user, token])

  const rhythmLoading = bestScores === undefined
  const scoreBest = bestScores?.score
  const accuracyBest = bestScores?.accuracy
  const comboBest = bestScores?.maxCombo
  const rankBest = bestScores?.rank

  return <div className="page-stack landing-page">
    {user ? <p className="welcome-banner">Welcome, {user.name}</p> : null}

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

      {user ? (
        <div className="feature-row stats-row" aria-label="Your statistics">
          <StatCard description="Keepsakes you've collected so far." icon="🏅" label="Badges Earned" value={userStats.badgesCount} />
          <StatCard description="Trivia questions you've answered." icon="❓" label="Trivia Attempts" value={userStats.triviaAttemptsCount} />
          <StatCard description="Rounds of the rhythm game you've played." icon="🎮" label="Rhythm Plays" value={userStats.gamePlaysCount} />
        </div>
      ) : (
        <div className="feature-row stats-row" aria-label="Community statistics">
          <StatCard description="Registered users exploring Shades of SG." icon="👥" label="Active Explorers" value={communityStats.usersCount} />
          <StatCard description="Published songs available to explore." icon="🎶" label="Heritage Songs" value={communityStats.songsCount} />
          <StatCard description="Community reflections approved and shared." icon="📖" label="Stories Shared" value={communityStats.reflectionsCount} />
        </div>
      )}
    </section>

    {user ? (
      <section className="content-section">
        <h2>Your Badges</h2>
        <BadgeShelf badges={badges} />
      </section>
    ) : null}

    <section className="content-section">
      <h2>Featured Songs</h2>
      {loading ? <p role="status">Loading featured stories…</p> : null}
      {error ? <div className="state-box" role="alert">{error}</div> : null}
      {!loading && !error && songs.length === 0 ? <EmptyState description="Published songs will appear here." title="No featured songs yet" /> : null}
      {!loading && !error && songs.length > 0
        ? <Carousel ariaLabel="Featured songs" items={songs} renderItem={(song) => <SongCard song={song} />} />
        : null}
      {songs.length > 0 ? <Link className="inline-link" to="/songs">View all songs →</Link> : null}
    </section>

    {user ? (
      <section className="content-section">
        <h2>Best Rhythm Game Stats</h2>
        <div className="feature-row rhythm-stats-row" aria-label="Your best rhythm game stats">
          <RhythmStatCard difficulty={scoreBest?.difficulty} icon="🏆" label="Score" loading={rhythmLoading} songTitle={scoreBest?.songTitle} value={scoreBest?.score ?? 0} />
          <RhythmStatCard difficulty={accuracyBest?.difficulty} icon="🎯" label="Accuracy" loading={rhythmLoading} songTitle={accuracyBest?.songTitle} suffix="%" value={accuracyBest ? Math.round(accuracyBest.accuracy) : 0} />
          <RhythmStatCard difficulty={comboBest?.difficulty} icon="🔥" label="Max Combo" loading={rhythmLoading} songTitle={comboBest?.songTitle} value={comboBest?.maxCombo ?? 0} />
          <RhythmStatCard difficulty={rankBest?.difficulty} icon="🥇" isText label="Rank" loading={rhythmLoading} songTitle={rankBest?.songTitle} value={rankBest?.rank || '—'} />
        </div>
      </section>
    ) : null}

    {!loading && !error && reflections.length > 0 ? <section className="content-section">
      <h2>Featured Reflections</h2>
      <Carousel ariaLabel="Featured reflections" items={reflections} renderItem={(reflection) => <ReflectionCard reflection={reflection} />} />
      <Link className="inline-link" to="/reflections">View all reflections →</Link>
    </section> : null}

    <section className="content-section two-column">
      <SectionCard title="Why Shades of SG" description="A shared base for music-led cultural discovery."><p>Begin with a published song and continue into its connected learning activities.</p></SectionCard>
      <SectionCard title="Continue Exploring" description="Follow a real song into its cultural and interactive experiences."><Link className="inline-link" to="/learning">Open Learning Hub</Link></SectionCard>
    </section>
  </div>
}
