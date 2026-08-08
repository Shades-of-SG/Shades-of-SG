import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, FolderHeart, Globe2, Languages, MapPin, Music2, Pencil, Quote, UserRound, UsersRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import '../Profile.css'
import { useAuth } from '../context/AuthContext'
import ProfileSectionHeader from '../components/profile/ProfileSectionHeader'
import { formatProfileDate } from '../components/profile/profileUtils'
import { getPublicCreatorProfile } from '../services/creatorProfileService'
import CreatorSocialLinks from '../components/profile/CreatorSocialLinks'

function PublicHero({ isOwner, profile }) {
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || 'C'
  return (
    <>
      {isOwner ? <div className="creator-profile-owner-banner"><span>This is your public profile.</span><div><Link to="/creator/profile">Back to Creator Profile</Link><Link to="/creator/profile/edit"><Pencil aria-hidden="true" /> Edit Profile</Link></div></div> : null}
      <section className="creator-profile-hero">
        <div aria-label={`${profile.displayName} creator avatar`} className="creator-profile-avatar">{profile.avatarUrl ? <img alt={`${profile.displayName} creator portrait`} src={profile.avatarUrl} /> : <span>{initial}</span>}<i aria-hidden="true"><Music2 /></i></div>
        <div className="creator-profile-hero__copy">
          <p className="creator-profile-eyebrow">{profile.creatorTitle}</p>
          <div className="creator-profile-name"><h1>{profile.displayName}</h1><span aria-label="Verified creator" className="creator-profile-verified" role="img"><CheckCircle2 aria-hidden="true" /></span></div>
          {profile.tagline ? <p className="creator-profile-bio">{profile.tagline}</p> : null}
          <div className="creator-profile-metadata">
            {profile.location ? <span><MapPin aria-hidden="true" />{profile.location}</span> : null}
            {profile.languages?.length ? <span><Languages aria-hidden="true" />{profile.languages.join(', ')}</span> : null}
            <span><CalendarDays aria-hidden="true" />Creator since {profile.creatorSince}</span>
          </div>
          {profile.contentFocus?.length ? <div aria-label="Creative focus" className="creator-profile-tags">{profile.contentFocus.map((focus) => <span key={focus}>{focus}</span>)}</div> : null}
          <CreatorSocialLinks displayName={profile.displayName} socialLinks={profile.socialLinks} />
        </div>
      </section>
    </>
  )
}

function PublicStats({ stats }) {
  const items = [
    { icon: Music2, label: 'Published songs', value: stats.publishedSongs || 0 },
    { icon: FolderHeart, label: 'Published collections', value: stats.publishedCollections || 0 },
    { icon: UsersRound, label: 'Public reflections', value: stats.communityReflections || 0 },
  ]
  return <section aria-label="Public creator statistics" className="creator-profile-stats">{items.map(({ icon: Icon, label, value }) => <article key={label}><Icon aria-hidden="true" /><div><strong>{value}</strong><span>{label}</span></div><small>Publicly available</small></article>)}</section>
}

function PublishedSongs({ profile, songs }) {
  return (
    <section className="creator-profile-section creator-profile-collection">
      <ProfileSectionHeader subtitle={`Published music by ${profile.displayName}`} title="Published Songs" />
      {songs.length ? <div className="creator-profile-song-grid">{songs.map((song) => <article className="creator-profile-song-card" key={song.id}><div className="creator-profile-song-card__art">{song.coverImageUrl ? <img alt={`${song.title} cover`} src={song.coverImageUrl} /> : <span aria-hidden="true"><Music2 /></span>}<span className="creator-profile-status is-published">PUBLISHED</span></div><div className="creator-profile-song-card__body"><h3>{song.title}</h3><div className="creator-profile-song-card__details"><span>{song.languages?.join(', ') || 'Language not set'}</span><span>{song.theme || 'Theme not set'}</span></div><p>Published {formatProfileDate(song.publishedDate, 'recently')}</p></div><div className="creator-profile-song-card__actions"><Link to={`/songs/${song.id}`}>Explore Song <ArrowRight aria-hidden="true" /></Link></div></article>)}</div> : <div className="creator-profile-empty"><Music2 aria-hidden="true" /><h3>No published songs yet</h3><p>When {profile.displayName} publishes music, it will appear here.</p></div>}
    </section>
  )
}

function PublicAbout({ profile }) {
  return <section className="creator-profile-about"><div className="creator-profile-about__copy"><p className="creator-profile-section-kicker">The artist behind the music</p><h2>About {profile.displayName}</h2><p>{profile.bio || `${profile.displayName} has not added a bio yet.`}</p></div><div className="creator-profile-about__details">{profile.languages?.length ? <div><Languages aria-hidden="true" /><span><small>Languages</small><strong>{profile.languages.join(' / ')}</strong></span></div> : null}{profile.contentFocus?.length ? <div><Globe2 aria-hidden="true" /><span><small>Cultural focus</small><strong>{profile.contentFocus.join(' / ')}</strong></span></div> : null}</div><Music2 aria-hidden="true" className="creator-profile-about__music" /></section>
}

function PublicCollections({ collections }) {
  return <section className="creator-profile-section"><ProfileSectionHeader subtitle="Curated public collections featuring this creator's work" title="Published Collections" />{collections.length ? <div className="creator-profile-public-collections">{collections.map((collection) => <Link key={collection.id} to={`/learning/heritage-vault?collection=${encodeURIComponent(collection.slug)}`}><FolderHeart aria-hidden="true" /><span><strong>{collection.name}</strong><small>{collection.songs.length} {collection.songs.length === 1 ? 'song' : 'songs'}</small></span><ArrowRight aria-hidden="true" /></Link>)}</div> : <div className="creator-profile-empty creator-profile-empty--compact"><FolderHeart aria-hidden="true" /><h3>No published collections yet</h3><p>Public collections featuring this creator will appear here.</p></div>}</section>
}

function PublicCommunity({ profile, reflections }) {
  return <section className="creator-profile-section creator-profile-community"><ProfileSectionHeader subtitle={`Public memories shared on ${profile.displayName}'s published songs`} title="From the Community" />{reflections.length ? <div className="creator-profile-community-grid">{reflections.slice(0, 3).map((reflection) => <article key={reflection.id}><UsersRound aria-hidden="true" /><blockquote>{reflection.content}</blockquote><div><strong>{reflection.isAnonymous ? 'Anonymous' : reflection.displayName || 'Anonymous'}</strong><span>{reflection.song?.title || 'Song unavailable'} · {formatProfileDate(reflection.createdAt)}</span></div></article>)}</div> : <div className="creator-profile-empty creator-profile-empty--compact"><UsersRound aria-hidden="true" /><h3>No public reflections yet</h3><p>Approved community memories will appear here when available.</p></div>}</section>
}

export default function PublicCreatorProfile() {
  const { creatorId } = useParams()
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getPublicCreatorProfile(creatorId, token)
      .then((value) => { if (active) { setData(value); setError('') } })
      .catch((nextError) => { if (active) { setData(null); setError(nextError.status === 404 ? 'This creator profile is private or unavailable.' : nextError.message) } })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [creatorId, token])

  if (loading) return <div className="creator-profile"><div className="creator-profile-settings__loading" role="status">Loading creator profile…</div></div>
  if (error) return <div className="creator-profile"><div className="creator-profile-empty creator-profile-public-error" role="alert"><UserRound aria-hidden="true" /><h1>Creator profile unavailable</h1><p>{error}</p><Link className="creator-profile-button" to="/songs">Explore published songs</Link></div></div>

  const { collections = [], isOwner, profile, reflections = [], songs = [], stats = {} } = data
  return <div className="creator-profile creator-profile--public"><PublicHero isOwner={isOwner} profile={profile} /><PublicStats stats={stats} /><PublishedSongs profile={profile} songs={songs} /><div className="creator-profile-editorial-grid"><PublicAbout profile={profile} /><PublicCommunity profile={profile} reflections={reflections} /></div>{profile.featuredQuote ? <aside aria-label="Featured artist quote" className="creator-profile-quote"><Quote aria-hidden="true" /><div><p>Featured Quote</p><blockquote>“{profile.featuredQuote}”</blockquote><cite>— {profile.displayName}</cite></div><span aria-hidden="true" className="creator-profile-quote__waveform" /></aside> : null}<PublicCollections collections={collections} /></div>
}
