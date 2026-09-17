import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, Drum, Flame, Headphones, Medal, MessageCircle, Target, Trophy } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import BadgeShelf from '../components/BadgeShelf'
import Carousel from '../components/Carousel'
import EmptyState from '../components/EmptyState'
import FeatureCard from '../components/FeatureCard'
import PageHeader from '../components/PageHeader'
import ReflectionCard from '../components/ReflectionCard'
import ReflectionDiscussionModal from '../components/ReflectionDiscussionModal'
import RhythmStatCard from '../components/RhythmStatCard'
import SongCard from '../components/SongCard'
import { useAuth } from '../context/AuthContext'
import { getUserBadges } from '../services/badgeService'
import Reveal from '../components/Reveal'
import { getPublishedSongs } from '../services/publicSongService'
import { getReflections, likeReflection, unlikeReflection } from '../services/reflectionService'
import { getMyBestScores } from '../services/scoreService'
import './Landing.css'

export default function Landing() {
  const { user, userProfile, token } = useAuth()
  const navigate = useNavigate()
  const [songs, setSongs] = useState([])
  const [reflections, setReflections] = useState([])
  const [discussionReflection, setDiscussionReflection] = useState(null)
  const [likeBusyIds, setLikeBusyIds] = useState(new Set())
  const likeRequests = useRef(new Set())
  const [interactionError, setInteractionError] = useState('')
  const [badges, setBadges] = useState(null)
  const [bestScores, setBestScores] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([getPublishedSongs({ limit: 5, page: 1 }), getReflections(token)])
      .then(([songPage, nextReflections]) => {
        if (!active) return
        setSongs((songPage.items || songPage).slice(0, 5))
        setReflections(nextReflections.slice(0, 5))
      })
      .catch((nextError) => active && setError(nextError.message))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (!user || !token) return undefined
    let active = true

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
  const displayName = userProfile?.profile?.displayName || user?.name
  const closeDiscussion = useCallback(() => setDiscussionReflection(null), [])

  function updateDiscussionReflection(nextReflection) {
    setDiscussionReflection((current) => current?.id === nextReflection.id ? nextReflection : current)
    setReflections((items) => items.map((item) => item.id === nextReflection.id ? nextReflection : item))
  }

  async function toggleReflectionLike(reflection) {
    if (likeRequests.current.has(reflection.id)) return
    likeRequests.current.add(reflection.id)
    setLikeBusyIds((current) => new Set(current).add(reflection.id))
    setInteractionError('')
    const optimistic = {
      ...reflection,
      isLiked: !reflection.isLiked,
      likeCount: Math.max(0, reflection.likeCount + (reflection.isLiked ? -1 : 1)),
    }
    updateDiscussionReflection(optimistic)
    try {
      const result = reflection.isLiked
        ? await unlikeReflection(reflection.id, token)
        : await likeReflection(reflection.id, token)
      updateDiscussionReflection({ ...optimistic, isLiked: result.liked, likeCount: result.likeCount })
    } catch (nextError) {
      updateDiscussionReflection(reflection)
      setInteractionError(nextError.message)
    } finally {
      likeRequests.current.delete(reflection.id)
      setLikeBusyIds((current) => { const next = new Set(current); next.delete(reflection.id); return next })
    }
  }

  return (
    <div className="page-stack landing-page">
      {user ? <p className="welcome-banner">Welcome, {displayName}</p> : null}

      <section className="hero-panel">
        <div className="hero-panel__content">
          <PageHeader
            description="Discover original songs from local creators, explore the stories behind them, play along and share the memories they bring back."
            eyebrow="MUSIC &#8226; STORIES &#8226; COMMUNITY"
            title="Where Singapore's stories become music."
          />
          <div className="hero-actions">
            <Link className="primary-link" to="/songs">
              Explore Songs
            </Link>
            <Link className="secondary-link" to="/apply/creator">
              Share Your Music
            </Link>
          </div>
        </div>
      </section>

      <section className="content-section journey-section" id="journey">
        <Reveal as="header" className="section-heading landing-heading-reveal">
          <h2>Explore Shades of SG</h2>
          <p>Discover music, stories and experiences created around Singapore.</p>
        </Reveal>
        <div className="feature-row">
          {[
            {
              description: 'Explore original songs and the stories behind them.',
              icon: <Headphones />,
              title: 'Discover Music',
              to: '/songs',
            },
            {
              description: "Learn about Singapore's music, culture and traditions.",
              icon: <BookOpen />,
              title: 'Explore the Story',
              to: '/learning',
            },
            {
              description: 'Try rhythm challenges inspired by featured songs.',
              icon: <Drum />,
              title: 'Play the Rhythm',
              to: '/rhythm-game',
            },
            {
              description: 'Share memories and connect through community reflections.',
              icon: <MessageCircle />,
              title: 'Join the Conversation',
              to: '/reflections',
            },
          ].map((feature, index) => (
            <Reveal className="landing-card-reveal" delay={index * 90} key={feature.title}>
              <FeatureCard {...feature} />
            </Reveal>
          ))}
        </div>
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
              <SongCard song={song} variant="featured" />
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
            <RhythmStatCard difficulty={rankBest?.difficulty} icon={<Medal />} isText label="Rank" loading={rhythmLoading} songTitle={rankBest?.songTitle} value={rankBest?.rank || '\u2014'} />
          </div>
        </section>
      ) : null}

      {!loading && !error && reflections.length > 0 ? (
        <section className="content-section landing-memories">
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
                {/* Keep ownership edit/delete tools on the Reflection Wall. */}
                <ReflectionCard
                  likeBusy={likeBusyIds.has(reflection.id)}
                  onLike={toggleReflectionLike}
                  onOpen={setDiscussionReflection}
                  reflection={{ ...reflection, isOwner: false }}
                />
              </Reveal>
            )}
          />
          {interactionError ? <p role="alert">{interactionError}</p> : null}
        </section>
      ) : null}

      <Reveal as="section" className="landing-cta landing-cta-reveal">
        <div>
          <h2>Have a story worth hearing?</h2>
          <p>Share your original music, connect with listeners and become part of Singapore's growing music story.</p>
        </div>
        <div className="landing-cta__actions">
          <Link className="primary-link" to="/songs">Explore Songs</Link>
          <Link className="secondary-link" to="/apply/creator">Become a Creator</Link>
        </div>
      </Reveal>
      {discussionReflection ? (
        <ReflectionDiscussionModal
          onClose={closeDiscussion}
          onLogin={() => navigate('/login', { state: { from: { pathname: '/' } } })}
          onReflectionChange={updateDiscussionReflection}
          reflection={discussionReflection}
          token={token}
          user={user}
        />
      ) : null}
    </div>
  )
}
