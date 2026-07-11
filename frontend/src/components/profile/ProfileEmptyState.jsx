import { Link } from 'react-router-dom'

export default function ProfileEmptyState({ actionLabel, description, title, to, variant = 'memory' }) {
  return <div className={`profile-empty profile-empty--${variant}`}><div aria-hidden="true" className="profile-empty__illustration"><span /><span /><span /></div><h3>{title}</h3><p>{description}</p><Link className="profile-button profile-button--soft" to={to}>{actionLabel}</Link></div>
}
