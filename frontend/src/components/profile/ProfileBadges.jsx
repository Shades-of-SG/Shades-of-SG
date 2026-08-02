import ProfileEmptyState from './ProfileEmptyState'
import ProfileSectionHeader from './ProfileSectionHeader'
import { BADGE_DEFINITIONS, badgePresentation } from './badgeDefinitions'
import { formatProfileDate } from './profileUtils'

export default function ProfileBadges({ badges, error, loading, onRetry, subtitle = 'Badges I am proud of', title = 'My Keepsakes' }) {
  const knownNames = Object.keys(BADGE_DEFINITIONS)
  const earnedNames = new Set(badges.map((badge) => badge.name))
  const earnedKnown = knownNames.filter((name) => earnedNames.has(name)).length
  const nextBadge = knownNames.find((name) => !earnedNames.has(name))
  const progress = Math.round((earnedKnown / knownNames.length) * 100)
  return (
    <section className="profile-section profile-keepsakes">
      <ProfileSectionHeader subtitle={subtitle} title={title} />
      {!loading && !error ? <div className="profile-badge-progress"><div><strong>Badge journey</strong><span>{earnedKnown} of {knownNames.length} core badges</span></div><div aria-label={`${progress}% of core badges earned`} aria-valuemax="100" aria-valuemin="0" aria-valuenow={progress} role="progressbar"><i style={{ width: `${progress}%` }} /></div>{nextBadge ? <small>Next keepsake to discover: {nextBadge}</small> : <small>All core keepsakes collected.</small>}</div> : null}
      {loading ? <div className="profile-badge-row">{[1, 2, 3].map((value) => <span className="profile-skeleton profile-skeleton--badge" key={value} />)}</div> : null}
      {error ? <div className="profile-error" role="alert"><p>{error}</p><button onClick={onRetry} type="button">Retry</button></div> : null}
      {!loading && !error && !badges.length ? <ProfileEmptyState actionLabel="Start exploring" description="Collect keepsakes through reflections, rhythm activities, and cultural discovery." title="Your keepsake shelf is waiting" to="/learning" variant="keepsake" /> : null}
      {!loading && !error && badges.length ? (
        <div className="profile-badge-row">
          {badges.map((badge) => {
            const meta = badgePresentation(badge.name)
            const Icon = meta.icon
            const description = badge.description || meta.description
            return (
              <article aria-label={`${badge.name}: ${description}`} className="profile-badge" key={badge.id} tabIndex={0} title={description}>
                <span aria-hidden="true" className="profile-badge__loop" />
                <Icon aria-hidden="true" />
                <strong>{badge.name}</strong>
                <p>{description}</p>
                <small>{[meta.category, formatProfileDate(badge.earnedAt)].filter(Boolean).join(' · ')}</small>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
