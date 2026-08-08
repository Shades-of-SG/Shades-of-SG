import { Link } from 'react-router-dom'
import { highlightMatch } from '../utils/highlightMatch'

export default function CreatorNameLink({ className = '', highlight, song }) {
  const creatorId = song?.creator?.id || song?.creatorId
  const label = song?.creator?.displayName || song?.artist || 'Artist unavailable'
  const content = highlight ? highlightMatch(label, highlight) : label
  if (!creatorId) return <span className={className}>{content}</span>
  return <Link className={`creator-name-link ${className}`.trim()} to={`/creators/${creatorId}`}>{content}</Link>
}
