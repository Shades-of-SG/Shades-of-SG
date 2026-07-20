import { CalendarDays, Heart, Moon, Pencil, Sun } from 'lucide-react'
import { formatProfileDate } from './profileUtils'

export default function ProfileHero({ onEdit, onToggleTheme, theme, user }) {
  const displayName = user?.name || 'Memory Keeper'
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M'
  const avatarUrl = user?.avatarUrl || user?.avatar_url
  const joinedAt = user?.createdAt || user?.created_at

  return (
    <section className="profile-hero">
      <div aria-label={`${displayName} profile avatar`} className="profile-hero__photo">
        {avatarUrl ? <img alt={`${displayName} profile`} src={avatarUrl} /> : <span>{initial}</span>}
      </div>
      <div className="profile-hero__copy">
        <p className="profile-kicker">Memory Keeper <Heart aria-hidden="true" size={15} /></p>
        <h1>{displayName}</h1>
        {user?.bio ? <p className="profile-bio">{user.bio}</p> : null}
        {joinedAt ? <p className="profile-member"><CalendarDays aria-hidden="true" size={16} /> Member since {formatProfileDate(joinedAt)}</p> : null}
      </div>
      <div className="profile-hero__actions">
        <button aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} className="profile-theme-toggle" onClick={onToggleTheme} type="button">
          {theme === 'dark' ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
        </button>
        <button className="profile-button profile-hero__edit" onClick={onEdit} type="button"><Pencil aria-hidden="true" size={15} /> Edit Profile</button>
      </div>
      <svg aria-hidden="true" className="profile-hero__skyline" viewBox="0 0 520 190">
        <path d="M12 170h496M34 170v-48h40v48m9 0V92h34v78m12 0v-65h42v65m20 0v-38h35v38m21 0v-74h30v74m17 0v-49h42v49m20 0v-91h13v91m15 0v-57h42v57m19 0v-39h44v39" />
        <path d="M245 96h34m-25-14h16m98 31c18-35 47-35 65 0m-54 0h43m-181 19c8-23 29-34 43-16 10-23 34-15 40 16" />
        <circle cx="473" cy="49" r="19" /><path d="M459 49h28M473 35v28" />
      </svg>
      <span aria-hidden="true" className="profile-hero__stamp">SINGAPORE<br />MEMORY POST</span>
    </section>
  )
}
