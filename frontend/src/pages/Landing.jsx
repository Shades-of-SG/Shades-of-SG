import { useEffect, useState } from 'react'
import { Award, BookOpen, Drum, Flame, Gamepad2, HelpCircle, Headphones, Medal, MessageCircle, Music, Target, Trophy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import BadgeShelf from '../components/BadgeShelf'
import Carousel from '../components/Carousel'
import EmptyState from '../components/EmptyState'
import FeatureCard from '../components/FeatureCard'
import PageHeader from '../components/PageHeader'
import ReflectionCard from '../components/ReflectionCard'
import RhythmStatCard from '../components/RhythmStatCard'
import SongCard from '../components/SongCard'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'
import { getUserBadges } from '../services/badgeService'
import Reveal from '../components/Reveal'
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

  return (
    <div className="page-stack landing-page">
      {user ? <p className="welcome-banner">Welcome, {user.name}</p> : null}

      <section className="hero-panel">
        <div className="hero-panel__content">
          <PageHeader
            description="Explore Singapore stories through published songs, cultural learning, rhythm, and shared memories."
            eyebrow="Music • Memory • Culture"
            title="Discover Singapore through music and memories"
          />
          <div className="hero-actions">
            <Link className="primary-link" to="/songs">
              Explore Songs
            </Link>
            <a className="secondary-link" href="#journey">
              Discover How It Works
            </a>
          </div>
        </div>
      </section>

      <section className="content-section journey-section" id="journey">
        <Reveal as="header" className="section-heading landing-heading-reveal">
          <h2>Your journey through Singapore&rsquo;s music</h2>
          <p>Listen, learn, play and reflect through one connected cultural experience.</p>
        </Reveal>
        <div className="feature-row">
          {[
            {
              description: 'Explore Singapore songs and the stories behind them.',
              icon: <Headphones />,
              title: 'Listen & Discover',
              to: '/songs',
            },
            {
              description: 'Discover cultural instruments, traditions and interactive activities.',
              icon: <BookOpen />,
              title: 'Learn & Play',
              to: '/learning',
            },
            {
              description: 'Play rhythm challenges inspired by featured songs.',
              icon: <Drum />,
              title: 'Test Your Rhythm',
              to: '/rhythm-game',
            },
            {
              description: 'Post a reflection and connect through shared experiences.',
              icon: <MessageCircle />,
              title: 'Share Your Memory',
              to: '/reflections',
            },
          ].map((feature, index) => (
            <Reveal className="landing-card-reveal" delay={index * 90} key={feature.title}>
              <FeatureCard {...feature} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="content-section">
        <Reveal as="header" className="landing-section-header landing-heading-reveal">
          <div className="landing-section-header__row">
            <h2>Stats</h2>
          </div>
        </Reveal>

        {user ? (
          <div className="feature-row stats-row" aria-label="Your statistics">
            <StatCard description="Keepsakes you've collected so far." icon={<Award />} label="Badges Earned" value={userStats.badgesCount} />
            <StatCard description="Trivia questions you've answered." icon={<HelpCircle />} label="Trivia Attempts" value={userStats.triviaAttemptsCount} />
            <StatCard description="Rounds of the rhythm game you've played." icon={<Gamepad2 />} label="Rhythm Plays" value={userStats.gamePlaysCount} />
          </div>
        ) : (
          <div className="feature-row stats-row" aria-label="Community statistics">
            <StatCard description="Registered users exploring Shades of SG." icon={<Users />} label="Active Explorers" value={communityStats.usersCount} />
            <StatCard description="Published songs available to explore." icon={<Music />} label="Heritage Songs" value={communityStats.songsCount} />
            <StatCard description="Community reflections approved and shared." icon={<BookOpen />} label="Stories Shared" value={communityStats.reflectionsCount} />
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
        <Reveal as="header" className="landing-section-header landing-heading-reveal">
          <div className="landing-section-header__row">
            <h2>Featured Songs</h2>
            {songs.length > 0 ? (
              <Link className="landing-section-link" to="/songs">
                View all songs <span aria-hidden="true">&rarr;</span>
              </Link>
            ) : null}
          </div>
        </Reveal>
        {loading ? <p role="status">Loading featured stories&hellip;</p> : null}
        {error ? (
          <div className="state-box" role="alert">
            {error}
          </div>
        ) : null}
        {!loading && !error && songs.length === 0 ? (
          <EmptyState
            description="Published songs will appear here."
            title="No featured songs yet"
          />
        ) : null}
        <Carousel
          ariaLabel="Featured songs"
          items={songs}
          renderItem={(song, index) => (
            <Reveal
              className="landing-card-reveal landing-song-reveal"
              delay={index * 100}
              key={song.id}
            >
              <SongCard song={song} />
            </Reveal>
          )}
        />
      </section>

      {user ? (
        <section className="content-section">
          <div className="landing-section-header__row">
            <h2>Best Rhythm Game Stats</h2>
              <Link className="landing-section-link" to="/rhythm-game">
                Play rhythm game <span aria-hidden="true">&rarr;</span>
              </Link>
          </div>

          <div className="feature-row rhythm-stats-row" aria-label="Your best rhythm game stats">
            <RhythmStatCard difficulty={scoreBest?.difficulty} icon={<Trophy />} label="Score" loading={rhythmLoading} songTitle={scoreBest?.songTitle} value={scoreBest?.score ?? 0} />
            <RhythmStatCard difficulty={accuracyBest?.difficulty} icon={<Target />} label="Accuracy" loading={rhythmLoading} songTitle={accuracyBest?.songTitle} suffix="%" value={accuracyBest ? Math.round(accuracyBest.accuracy) : 0} />
            <RhythmStatCard difficulty={comboBest?.difficulty} icon={<Flame />} label="Max Combo" loading={rhythmLoading} songTitle={comboBest?.songTitle} value={comboBest?.maxCombo ?? 0} />
            <RhythmStatCard difficulty={rankBest?.difficulty} icon={<Medal />} isText label="Rank" loading={rhythmLoading} songTitle={rankBest?.songTitle} value={rankBest?.rank || '—'} />
          </div>
        </section>
      ) : null}

      {!loading && !error && reflections.length > 0 ? (
        <section className="content-section">
          <Reveal
            as="header"
            className="landing-section-header section-heading landing-heading-reveal"
          >
            <div className="landing-section-header__row">
              <h2>Memories from the Community</h2>
              <Link className="landing-section-link" to="/reflections">
                View all reflections <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            <p>
              See how Singapore songs connect people to celebrations, milestones and everyday
              memories.
            </p>
          </Reveal>
          <Carousel
            ariaLabel="Community reflections"
            items={reflections}
            renderItem={(reflection, index) => (
              <Reveal
                className="landing-card-reveal landing-reflection-reveal"
                delay={index * 100}
                key={reflection.id}
              >
                <ReflectionCard reflection={reflection} />
              </Reveal>
            )}
          />
        </section>
      ) : null}

      <Reveal as="section" className="landing-cta landing-cta-reveal">
        <div>
          <h2>Every song carries a memory</h2>
          <p>Discover the stories behind Singapore&rsquo;s music and share one of your own.</p>
        </div>
        <Link className="primary-link" to="/songs">
          Start Exploring Songs
        </Link>
      </Reveal>
    </div>
  )
}
