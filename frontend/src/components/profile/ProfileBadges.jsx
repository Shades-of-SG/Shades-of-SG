import { useEffect, useState } from 'react'
import KeepsakeJournal from './KeepsakeJournal'
import ProfileEmptyState from './ProfileEmptyState'
import ProfileSectionHeader from './ProfileSectionHeader'
import { useAuth } from '../../context/AuthContext'
import { getBadgeCatalog } from '../../services/badgeService'

export default function ProfileBadges({ badges, error, loading, onRetry, subtitle = 'Badges I am proud of', title = 'My Keepsakes' }) {
  const { token } = useAuth()
  const [definitions, setDefinitions] = useState([])
  const [catalogError, setCatalogError] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(true)

  useEffect(() => {
    let active = true
    getBadgeCatalog(token)
      .then((value) => { if (active) { setDefinitions(value); setCatalogError('') } })
      .catch((err) => { if (active) setCatalogError(err.message) })
      .finally(() => { if (active) setCatalogLoading(false) })
    return () => { active = false }
  }, [token])

  const isLoading = loading || catalogLoading
  const combinedError = error || catalogError
  const knownNames = definitions.map((definition) => definition.name)
  const earnedNames = new Set(badges.map((badge) => badge.name))
  const earnedKnown = knownNames.filter((name) => earnedNames.has(name)).length
  const nextBadge = knownNames.find((name) => !earnedNames.has(name))
  const progress = knownNames.length ? Math.round((earnedKnown / knownNames.length) * 100) : 0

  return (
    <section className="profile-section profile-keepsakes">
      <ProfileSectionHeader subtitle={subtitle} title={title} />
      {!isLoading && !combinedError && knownNames.length ? <div className="profile-badge-progress"><div><strong>Badge journey</strong><span>{earnedKnown} of {knownNames.length} core badges</span></div><div aria-label={`${progress}% of core badges earned`} aria-valuemax="100" aria-valuemin="0" aria-valuenow={progress} role="progressbar"><i style={{ width: `${progress}%` }} /></div>{nextBadge ? <small>Next keepsake to discover: {nextBadge}</small> : <small>All core keepsakes collected.</small>}</div> : null}
      {isLoading ? <div className="profile-badge-row">{[1, 2, 3].map((value) => <span className="profile-skeleton profile-skeleton--badge" key={value} />)}</div> : null}
      {combinedError ? <div className="profile-error" role="alert"><p>{combinedError}</p><button onClick={onRetry} type="button">Retry</button></div> : null}
      {/* The sticker book always renders once the catalog loads — every badge shows greyed out
          until earned, so there's always a full book to browse, not just an empty state. */}
      {!isLoading && !combinedError && knownNames.length ? <KeepsakeJournal badges={badges} definitions={definitions} /> : null}
      {!isLoading && !combinedError && !knownNames.length ? <ProfileEmptyState actionLabel="Start exploring" description="Collect keepsakes through reflections, rhythm activities, and cultural discovery." title="Your keepsake shelf is waiting" to="/learning" variant="keepsake" /> : null}
    </section>
  )
}
