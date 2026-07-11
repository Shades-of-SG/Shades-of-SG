import { CalendarDays, Heart, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatProfileDate } from './profileUtils'

export default function ProfileHero({ user }) {
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'M'
  return <section className="profile-hero">
    <div className="profile-hero__photo" aria-label={`${user.name} profile avatar`}>
      {user.avatarUrl || user.avatar_url ? <img alt={`${user.name} profile`} src={user.avatarUrl || user.avatar_url} /> : <span>{initial}</span>}
    </div>
    <div className="profile-hero__copy">
      <p className="profile-kicker">Memory Keeper <Heart aria-hidden="true" size={15} /></p>
      <h1>{user.name}</h1>
      {user.bio ? <p className="profile-bio">{user.bio}</p> : <p className="profile-bio">Collecting songs, stories, and memories from Singapore.</p>}
      <p className="profile-member"><CalendarDays aria-hidden="true" size={16} /> Member since {formatProfileDate(user.createdAt || user.created_at, 'joining Shades of SG')}</p>
    </div>
    <Link className="profile-button profile-hero__edit" to="/settings"><Pencil aria-hidden="true" size={15} /> Edit Profile</Link>
    <svg aria-hidden="true" className="profile-hero__skyline" viewBox="0 0 520 190">
      <path d="M12 170h496M34 170v-48h40v48m9 0V92h34v78m12 0v-65h42v65m20 0v-38h35v38m21 0v-74h30v74m17 0v-49h42v49m20 0v-91h13v91m15 0v-57h42v57m19 0v-39h44v39" />
      <path d="M245 96h34m-25-14h16m98 31c18-35 47-35 65 0m-54 0h43m-181 19c8-23 29-34 43-16 10-23 34-15 40 16" />
      <circle cx="473" cy="49" r="19" /><path d="M459 49h28M473 35v28" />
    </svg>
    <span aria-hidden="true" className="profile-hero__stamp">SINGAPORE<br />MEMORY POST</span>
  </section>
}
