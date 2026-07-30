import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProfileBadges from '../components/profile/ProfileBadges'
import ProfileHero from '../components/profile/ProfileHero'
import ProfileMemories from '../components/profile/ProfileMemories'
import ProfileMusicJourney from '../components/profile/ProfileMusicJourney'
import ProfileStats from '../components/profile/ProfileStats'
import { useAuth } from '../context/AuthContext'
import { getPublicUserProfile } from '../services/userProfileService'

export default function PublicUserProfile() {
  const { userId } = useParams()
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getPublicUserProfile(userId, token)
      .then((value) => { if (active) { setData(value); setError('') } })
      .catch(() => { if (active) setError('This profile is private or unavailable.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token, userId])

  if (loading) return <div className="profile-page"><span className="profile-skeleton profile-skeleton--hero" role="status" /></div>
  if (error || !data) return <div className="profile-page"><div className="profile-empty" role="status"><h1>Profile unavailable</h1><p>{error}</p></div></div>

  const { badges = [], profile, reflections = [], rhythm } = data
  return (
    <div className="profile-page" data-theme="dark">
      <ProfileHero editable={false} isCreator={profile.isCreator} profile={profile} />
      {rhythm || badges.length ? <ProfileStats badges={data.visibleSections?.badges === false ? null : badges.length} loading={{ badges: false, scores: false }} rhythm={data.visibleSections?.rhythm === false ? null : rhythm} /> : null}
      {reflections.length ? <ProfileMemories loading={false} memories={reflections} subtitle={`Public reflections from ${profile.displayName}`} title="Reflections" /> : null}
      {badges.length ? <ProfileBadges badges={badges} loading={false} subtitle={`${profile.displayName}'s earned badges`} title="Keepsakes" /> : null}
      {rhythm ? <ProfileMusicJourney loading={false} scores={rhythm.recentScores || []} subtitle={`Recent scores from ${profile.displayName}`} title="Rhythm Journey" /> : null}
    </div>
  )
}
