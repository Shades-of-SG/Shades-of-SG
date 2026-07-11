import ProfileEmptyState from './ProfileEmptyState'
import ProfileSectionHeader from './ProfileSectionHeader'
import { badgePresentation } from './badgeDefinitions'
import { formatProfileDate } from './profileUtils'

export default function ProfileBadges({ badges, error, loading, onRetry }) {
  return <section className="profile-section profile-keepsakes"><ProfileSectionHeader subtitle="Badges I’m proud of" title="My Keepsakes" />
    {loading ? <div className="profile-badge-row">{[1, 2, 3].map((value) => <span className="profile-skeleton profile-skeleton--badge" key={value} />)}</div> : null}
    {error ? <div className="profile-error" role="alert"><p>{error}</p><button onClick={onRetry} type="button">Retry</button></div> : null}
    {!loading && !error && !badges.length ? <ProfileEmptyState actionLabel="Start exploring" description="Collect keepsakes through reflections, rhythm activities, and cultural discovery." title="Your keepsake shelf is waiting" to="/learning" variant="keepsake" /> : null}
    {!loading && !error && badges.length ? <div className="profile-badge-row">{badges.map((badge) => { const meta = badgePresentation(badge.name); const Icon = meta.icon; return <article className="profile-badge" key={badge.id} tabIndex="0" title={meta.description}><span className="profile-badge__loop" aria-hidden="true" /><Icon aria-hidden="true" /><strong>{badge.name}</strong><p>{badge.description || meta.description}</p><small>{meta.category} · {formatProfileDate(badge.earnedAt)}</small></article> })}</div> : null}
  </section>
}
