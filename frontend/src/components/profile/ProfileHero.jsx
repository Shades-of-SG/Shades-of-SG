import { CalendarDays, Heart, Pencil, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatProfileDate } from './profileUtils'

export default function ProfileHero({ editable = true, isCreator = false, profile = {} }) {
  const displayName = profile.displayName || 'Memory Keeper'
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M'

  return (
    <section className="profile-hero">
      <div aria-label={`${displayName} profile avatar`} className="profile-hero__photo">
        {profile.avatarUrl ? <img alt={`${displayName} profile`} src={profile.avatarUrl} /> : <span>{initial}</span>}
      </div>
      <div className="profile-hero__copy">
        <p className="profile-kicker">{isCreator ? 'Creator & Memory Keeper' : 'Memory Keeper'} <Heart aria-hidden="true" size={15} /></p>
        <h1>{displayName}</h1>
        {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
        {profile.location ? <p className="profile-member">{profile.location}</p> : null}
        {profile.createdAt ? <p className="profile-member"><CalendarDays aria-hidden="true" size={16} /> Member since {formatProfileDate(profile.createdAt)}</p> : null}
      </div>
      {editable ? <div className="profile-hero__actions"><Link className="profile-button profile-hero__edit" to="/settings#profile"><Pencil aria-hidden="true" size={15} /> Edit Profile</Link>{isCreator ? <Link className="profile-button profile-button--soft" to="/creator/profile"><Sparkles aria-hidden="true" size={15} /> Creator profile</Link> : null}</div> : null}
      <svg aria-hidden="true" className="profile-hero__skyline" viewBox="0 0 520 190"><path d="M12 170h496M34 170v-48h40v48m9 0V92h34v78m12 0v-65h42v65m20 0v-38h35v38m21 0v-74h30v74m17 0v-49h42v49m20 0v-91h13v91m15 0v-57h42v57m19 0v-39h44v39" /><path d="M245 96h34m-25-14h16m98 31c18-35 47-35 65 0m-54 0h43m-181 19c8-23 29-34 43-16 10-23 34-15 40 16" /><circle cx="473" cy="49" r="19" /><path d="M459 49h28M473 35v28" /></svg>
      <span aria-hidden="true" className="profile-hero__stamp">SINGAPORE<br />MEMORY POST</span>
    </section>
  )
}
