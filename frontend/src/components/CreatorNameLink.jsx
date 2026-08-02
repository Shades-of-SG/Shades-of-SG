import { Link } from 'react-router-dom'

export default function CreatorNameLink({ className = '', song }) {
  const creatorId = song?.creator?.id || song?.creatorId
  const label = song?.creator?.displayName || song?.artist || 'Artist unavailable'
  if (!creatorId) return <span className={className}>{label}</span>
  return <Link className={`creator-name-link ${className}`.trim()} to={`/creators/${creatorId}`}>{label}</Link>
}
