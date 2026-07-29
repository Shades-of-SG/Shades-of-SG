import { useEffect, useState } from 'react'
import { BookOpen, Drum, Headphones, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import FeatureCard from '../components/FeatureCard'
import PageHeader from '../components/PageHeader'
import ReflectionCard from '../components/ReflectionCard'
import Reveal from '../components/Reveal'
import SongCard from '../components/SongCard'
import { getPublishedSongs } from '../services/publicSongService'
import { getReflections } from '../services/reflectionService'

export default function Landing() {
  const [songs, setSongs] = useState([])
  const [reflections, setReflections] = useState([])
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

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="page-stack landing-page">
      <section className="hero-panel">
        <div className="hero-panel__content">
          <PageHeader
            description="Explore local songs, uncover the stories behind them, play cultural activities, and share what the music means to you."
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
        <div className="responsive-grid">
          {songs.map((song, index) => (
            <Reveal
              className="landing-card-reveal landing-song-reveal"
              delay={index * 100}
              key={song.id}
            >
              <SongCard song={song} />
            </Reveal>
          ))}
        </div>
      </section>

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
          <div
            className={`landing-reflections${reflections.length === 2 ? ' landing-reflections--two' : ''}`}
          >
            {reflections.map((reflection, index) => (
              <Reveal
                className="landing-card-reveal landing-reflection-reveal"
                delay={index * 100}
                key={reflection.id}
              >
                <ReflectionCard reflection={reflection} />
              </Reveal>
            ))}
          </div>
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
