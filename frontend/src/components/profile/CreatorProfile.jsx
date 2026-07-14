import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, CheckCircle2, Clock3, Disc3, FilePenLine, Globe2, Languages, MapPin,
  Music2, Pencil, Quote, Settings, Sparkles, UsersRound, WandSparkles,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getBeatmapSummary } from '../../services/beatmapService'
import { getModerationReflections } from '../../services/reflectionService'
import { getCreatorDashboardSummary, getCreatorSongs } from '../../services/songService'
import ProfileSectionHeader from './ProfileSectionHeader'
import { formatProfileDate } from './profileUtils'

// TODO: Replace these fallbacks when persisted creator biography/profile fields are introduced.
const CREATOR_PROFILE_FALLBACK = Object.freeze({
  about: 'Music has always been Violet\'s way of holding onto the places, voices, and everyday moments that make Singapore feel like home. Her work reimagines local stories through contemporary songs, helping younger audiences discover a personal connection to the heritage around them.',
  bio: 'Turning Singapore\'s stories, sounds, and memories into music for everyone to explore.',
  creatorSince: '2025',
  displayName: 'Violet',
  languages: ['English', 'Mandarin'],
  location: 'Singapore',
  role: 'Creator & Storyteller',
  themes: ['Heritage', 'Community', 'Storytelling'],
  quote: 'Every song is a conversation with Singapore\'s memories.',
})

const EMPTY_SUMMARY = { counts: {}, generationJobs: [], recentSongs: [] }
const STATUS_ORDER = { PUBLISHED: 0, READY: 1, GENERATING: 2, DRAFT: 3, ARCHIVED: 4 }

function sortCollection(songs) {
  return [...songs]
    .filter((song) => song.status !== 'ARCHIVED')
    .sort((first, second) => {
      const statusDifference = (STATUS_ORDER[first.status] ?? 9) - (STATUS_ORDER[second.status] ?? 9)
      if (statusDifference) return statusDifference
      return new Date(second.publishedDate || second.updatedAt || 0) - new Date(first.publishedDate || first.updatedAt || 0)
    })
}

function CreatorProfileHero({ profile }) {
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || 'V'

  return (
    <section className="creator-profile-hero">
      <div aria-label={`${profile.displayName} creator avatar`} className="creator-profile-avatar">
        {profile.avatarUrl ? <img alt={`${profile.displayName} creator portrait`} src={profile.avatarUrl} /> : <span>{initial}</span>}
        <i aria-hidden="true"><Music2 /></i>
      </div>
      <div className="creator-profile-hero__copy">
        <p className="creator-profile-eyebrow"><Sparkles aria-hidden="true" /> {profile.role}</p>
        <div className="creator-profile-name">
          <h1>{profile.displayName}</h1>
          <span aria-label="Verified creator" className="creator-profile-verified" role="img"><CheckCircle2 aria-hidden="true" /></span>
        </div>
        <p className="creator-profile-bio">{profile.bio}</p>
        <div className="creator-profile-metadata">
          <span><MapPin aria-hidden="true" />{profile.location}-based artist</span>
          <span><Languages aria-hidden="true" />{profile.languages.join(', ')}</span>
          <span><CalendarDays aria-hidden="true" />Creator since {profile.creatorSince}</span>
        </div>
        <div aria-label="Creative focus" className="creator-profile-tags">
          {profile.themes.map((theme) => <span key={theme}>{theme}</span>)}
        </div>
      </div>
      <Link className="creator-profile-button creator-profile-button--secondary creator-profile-hero__edit" to="/creator/settings">
        <Pencil aria-hidden="true" /> Edit Profile
      </Link>
      <svg aria-hidden="true" className="creator-profile-skyline" viewBox="0 0 520 190">
        <path d="M5 165h510M34 165v-42h18v42m12 0V95h31v70m15 0v-29h23v29m17 0V78h39v87m14 0v-51h27v51m30 0V91h17v74m14 0v-35h39v35m18 0v-72h27v72m23 0v-49h31v49m14 0v-93h21v93" />
        <path d="M367 72c0-27 44-27 44 0M378 48V23m22 25V23" />
      </svg>
    </section>
  )
}

function CreatorProfileStats({ counts, loading }) {
  const items = [
    { detail: 'Live in the public library', icon: Music2, label: 'Published songs', value: counts.PUBLISHED || 0 },
    { detail: 'Drafting or generating', icon: FilePenLine, label: 'In-progress songs', value: (counts.DRAFT || 0) + (counts.GENERATING || 0) },
    { detail: 'Prepared for release', icon: CheckCircle2, label: 'Ready to publish', value: counts.READY || 0 },
    { detail: 'Across every workflow stage', icon: Disc3, label: 'Total songs', value: counts.total || 0 },
  ]

  return (
    <section aria-label="Creator statistics" className="creator-profile-stats">
      {items.map(({ detail, icon: Icon, label, value }) => (
        <article key={label}>
          <Icon aria-hidden="true" />
          <div>{loading ? <span className="creator-profile-skeleton creator-profile-skeleton--number" /> : <strong>{value}</strong>}<span>{label}</span></div>
          <small>{detail}</small>
        </article>
      ))}
    </section>
  )
}

function RhythmAvailability({ beatmaps }) {
  if (!beatmaps) return null
  const published = beatmaps.some((beatmap) => beatmap.status === 'PUBLISHED')
  return <span className={`creator-profile-rhythm ${published ? 'is-ready' : ''}`}><Disc3 aria-hidden="true" />{published ? 'Rhythm Ready' : 'No Rhythm Yet'}</span>
}

function CreatorSongCard({ beatmaps, song }) {
  const published = song.status === 'PUBLISHED'
  const languages = [...(song.languages || []), ...(song.otherLanguages || [])]
  const date = published ? song.publishedDate || song.updatedAt : song.updatedAt

  return (
    <article className="creator-profile-song-card">
      <div className="creator-profile-song-card__art">
        {song.coverImageUrl ? <img alt={`${song.title} cover`} src={song.coverImageUrl} /> : <span aria-hidden="true"><Music2 /></span>}
        <span className={`creator-profile-status is-${song.status?.toLowerCase() || 'draft'}`}>{song.status || 'DRAFT'}</span>
      </div>
      <div className="creator-profile-song-card__body">
        <h3>{song.title}</h3>
        <div className="creator-profile-song-card__details">
          <span>{languages.length ? languages.join(', ') : 'Language not set'}</span>
          <span>{song.theme || 'Theme not set'}</span>
          <RhythmAvailability beatmaps={beatmaps} />
        </div>
        <p>{published ? 'Published' : 'Updated'} {formatProfileDate(date, 'recently')}</p>
      </div>
      <div className="creator-profile-song-card__actions">
        {published ? <Link to={`/songs/${song.id}`}>View Public Page</Link> : null}
        <Link to={`/creator/studio/${song.id}`}>{published ? 'Open in Studio' : 'Continue Editing'}</Link>
      </div>
    </article>
  )
}

function CreatorSongCollection({ beatmapsBySong, error, loading, onRetry, profile, songs }) {
  return (
    <section className="creator-profile-section creator-profile-collection">
      <ProfileSectionHeader
        action={<Link to="/creator/songs">View all songs</Link>}
        subtitle="Published work first, followed by songs still taking shape"
        title="Published Collection"
      />
      {error ? <SectionError message={error} onRetry={onRetry} /> : null}
      {loading ? <div className="creator-profile-song-grid">{[1, 2, 3].map((value) => <span className="creator-profile-skeleton creator-profile-skeleton--song" key={value} />)}</div> : null}
      {!loading && !error && songs.length ? (
        <div className="creator-profile-song-grid">
          {songs.slice(0, 6).map((song) => <CreatorSongCard beatmaps={beatmapsBySong[song.id]} key={song.id} song={song} />)}
        </div>
      ) : null}
      {!loading && !error && !songs.length ? (
        <div className="creator-profile-empty">
          <Music2 aria-hidden="true" />
          <h3>The collection is waiting for its first song</h3>
          <p>{profile.displayName}'s published work and active drafts will appear here.</p>
          <Link className="creator-profile-button" to="/creator/studio/new">Create a song</Link>
        </div>
      ) : null}
    </section>
  )
}

function CreatorAbout({ profile }) {
  return (
    <section className="creator-profile-about">
      <div className="creator-profile-about__copy">
        <p className="creator-profile-section-kicker">The artist behind the music</p>
        <h2>About {profile.displayName}</h2>
        <p>{profile.about}</p>
      </div>
      <div className="creator-profile-about__details">
        <div><Languages aria-hidden="true" /><span><small>Languages</small><strong>{profile.languages.join(' / ')}</strong></span></div>
        <div><Globe2 aria-hidden="true" /><span><small>Cultural focus</small><strong>{profile.themes.join(' / ')}</strong></span></div>
      </div>
      <Music2 aria-hidden="true" className="creator-profile-about__music" />
    </section>
  )
}

function CreatorCommunity({ error, loading, onRetry, profile, reflections }) {
  return (
    <section className="creator-profile-section creator-profile-community">
      <ProfileSectionHeader
        action={<Link to="/creator/reflections">View All Reflections</Link>}
        subtitle={`Approved memories shared on ${profile.displayName}'s songs`}
        title="From the Community"
      />
      {error ? <SectionError message={error} onRetry={onRetry} /> : null}
      {loading ? <div className="creator-profile-community-grid">{[1, 2].map((value) => <span className="creator-profile-skeleton creator-profile-skeleton--reflection" key={value} />)}</div> : null}
      {!loading && !error && reflections.length ? (
        <div className="creator-profile-community-grid">
          {reflections.map((reflection) => (
            <article key={reflection.id}>
              <UsersRound aria-hidden="true" />
              <blockquote>{reflection.content}</blockquote>
              <div><strong>{reflection.isAnonymous ? 'Anonymous' : reflection.displayName || 'Anonymous'}</strong><span>{reflection.song?.title || 'Song unavailable'} · {formatProfileDate(reflection.createdAt)}</span></div>
            </article>
          ))}
        </div>
      ) : null}
      {!loading && !error && !reflections.length ? (
        <div className="creator-profile-empty creator-profile-empty--compact">
          <UsersRound aria-hidden="true" />
          <h3>Stories will gather here</h3>
          <p>As listeners begin sharing memories inspired by {profile.displayName}'s songs, selected reflections will appear here.</p>
        </div>
      ) : null}
    </section>
  )
}

function CreatorFeaturedQuote({ profile }) {
  return (
    <aside aria-label="Featured artist quote" className="creator-profile-quote">
      <Quote aria-hidden="true" />
      <div>
        <p>Featured Quote</p>
        <blockquote>“{profile.quote}”</blockquote>
        <cite>— {profile.displayName}</cite>
      </div>
      <span aria-hidden="true" className="creator-profile-quote__waveform" />
    </aside>
  )
}

const activityPresentation = {
  COMPLETED: { copy: 'Generation completed', icon: CheckCircle2 },
  FAILED: { copy: 'Generation needs attention', icon: Clock3 },
  PROCESSING: { copy: 'Generation in progress', icon: WandSparkles },
  QUEUED: { copy: 'Generation queued', icon: Clock3 },
}

function CreatorActivity({ error, jobs, loading, onRetry }) {
  const uniqueJobs = jobs.filter((job, index, all) => {
    const songId = job.song?.id || job.songId
    return all.findIndex((candidate) => (candidate.song?.id || candidate.songId) === songId) === index
  }).slice(0, 4)

  return (
    <section className="creator-profile-section creator-profile-activity">
      <ProfileSectionHeader subtitle="Recent work behind the music" title="Studio Activity" />
      {error ? <SectionError message={error} onRetry={onRetry} /> : null}
      {loading ? <span className="creator-profile-skeleton creator-profile-skeleton--activity" /> : null}
      {!loading && !error && uniqueJobs.length ? (
        <ol className="creator-profile-timeline">
          {uniqueJobs.map((job) => {
            const presentation = activityPresentation[job.status] || { copy: `Generation ${job.status?.toLowerCase() || 'updated'}`, icon: WandSparkles }
            const Icon = presentation.icon
            return (
              <li key={job.id}>
                <span aria-hidden="true" className={`creator-profile-timeline__icon is-${job.status?.toLowerCase()}`}><Icon /></span>
                <div><strong>{job.song?.title || 'Untitled song'}</strong><span>{presentation.copy}</span></div>
                <time dateTime={job.createdAt}>{formatProfileDate(job.createdAt, 'Recently')}</time>
                <span className={`creator-profile-timeline__status is-${job.status?.toLowerCase()}`}>{job.status || 'UPDATED'}</span>
              </li>
            )
          })}
        </ol>
      ) : null}
      {!loading && !error && !uniqueJobs.length ? (
        <div className="creator-profile-empty creator-profile-empty--compact">
          <WandSparkles aria-hidden="true" />
          <h3>No recent studio activity</h3>
          <p>New generation work will be recorded here.</p>
        </div>
      ) : null}
    </section>
  )
}

function SectionError({ message, onRetry }) {
  return <div className="creator-profile-error" role="alert"><p>{message}</p><button onClick={onRetry} type="button">Retry</button></div>
}

export default function CreatorProfile() {
  const { token, user } = useAuth()
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [songs, setSongs] = useState([])
  const [reflections, setReflections] = useState([])
  const [beatmapsBySong, setBeatmapsBySong] = useState({})
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({ activity: '', community: '', songs: '' })

  const profile = useMemo(() => ({
    ...CREATOR_PROFILE_FALLBACK,
    avatarUrl: user?.avatarUrl || user?.avatar_url || '',
    bio: user?.bio || CREATOR_PROFILE_FALLBACK.bio,
    displayName: user?.name || CREATOR_PROFILE_FALLBACK.displayName,
    languages: user?.languages?.length ? user.languages : CREATOR_PROFILE_FALLBACK.languages,
    location: user?.location || CREATOR_PROFILE_FALLBACK.location,
    creatorSince: user?.createdAt && !Number.isNaN(new Date(user.createdAt).getFullYear())
      ? String(new Date(user.createdAt).getFullYear())
      : CREATOR_PROFILE_FALLBACK.creatorSince,
    themes: user?.themes?.length ? user.themes : CREATOR_PROFILE_FALLBACK.themes,
  }), [user])

  const load = useCallback(async () => {
    setLoading(true)
    setErrors({ activity: '', community: '', songs: '' })
    const [songResult, summaryResult, reflectionResult] = await Promise.allSettled([
      getCreatorSongs(token),
      getCreatorDashboardSummary(token),
      getModerationReflections({ limit: 24, page: 1, status: 'APPROVED' }, token),
    ])

    const nextErrors = { activity: '', community: '', songs: '' }
    if (songResult.status === 'fulfilled') {
      const nextSongs = songResult.value || []
      setSongs(nextSongs)
      const visibleSongs = sortCollection(nextSongs).slice(0, 6)
      const beatmapResults = await Promise.allSettled(visibleSongs.map((song) => getBeatmapSummary(song.id, { token })))
      setBeatmapsBySong(Object.fromEntries(visibleSongs.flatMap((song, index) => (
        beatmapResults[index].status === 'fulfilled' ? [[song.id, beatmapResults[index].value]] : []
      ))))
    } else {
      nextErrors.songs = songResult.reason?.message || 'Unable to load creator songs.'
    }

    if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value || EMPTY_SUMMARY)
    else nextErrors.activity = summaryResult.reason?.message || 'Unable to load recent studio activity.'

    if (reflectionResult.status === 'fulfilled') setReflections(reflectionResult.value?.reflections || [])
    else nextErrors.community = reflectionResult.reason?.message || 'Unable to load community reflections.'

    setErrors(nextErrors)
    setLoading(false)
  }, [token])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const orderedSongs = useMemo(() => sortCollection(songs), [songs])
  const counts = useMemo(() => {
    const byStatus = songs.reduce((current, song) => ({ ...current, [song.status]: (current[song.status] || 0) + 1 }), {})
    return { ...byStatus, total: songs.length }
  }, [songs])
  const creatorSongIds = useMemo(() => new Set(songs.map((song) => song.id)), [songs])
  const communityReflections = useMemo(() => reflections
    .filter((reflection) => reflection.status === 'APPROVED' && creatorSongIds.has(reflection.songId || reflection.song?.id))
    .slice(0, 3), [creatorSongIds, reflections])

  return (
    <div className="creator-profile">
      <CreatorProfileHero profile={profile} />
      <CreatorProfileStats counts={counts} loading={loading} />
      <CreatorSongCollection beatmapsBySong={beatmapsBySong} error={errors.songs} loading={loading} onRetry={load} profile={profile} songs={orderedSongs} />
      <div className="creator-profile-editorial-grid">
        <CreatorAbout profile={profile} />
        <CreatorCommunity error={errors.community} loading={loading} onRetry={load} profile={profile} reflections={communityReflections} />
      </div>
      <CreatorFeaturedQuote profile={profile} />
      <CreatorActivity error={errors.activity} jobs={summary.generationJobs || []} loading={loading} onRetry={load} />
      <section className="creator-profile-account">
        <div><Settings aria-hidden="true" /><span><strong>Account &amp; profile settings</strong><small>Update {profile.displayName}'s account preferences and profile details.</small></span></div>
        <Link className="creator-profile-button creator-profile-button--secondary" to="/creator/settings">Open Settings</Link>
      </section>
    </div>
  )
}
