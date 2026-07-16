import CreatorAccountWidget from './CreatorAccountWidget'
import { useAuth } from '../context/AuthContext'

export default function CreatorPageShell({ actions, breadcrumbs = [], children, className = '', description, eyebrow = 'Creator Portal', title }) {
  const { user } = useAuth()
  const showCreatorAccount = user?.role === 'CREATOR'

  return (
    <div className={`creator-page ${className}`.trim()}>
      <header className="creator-page__header">
        <div className="creator-page__copy">
          <p className="creator-page__breadcrumbs" aria-label="Breadcrumb">
            <span>{eyebrow}</span>
            {breadcrumbs.map((breadcrumb) => (
              <span key={breadcrumb}>{breadcrumb}</span>
            ))}
          </p>
          <div className="creator-page__title">
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
        </div>

        {(showCreatorAccount || actions) && (
          <div className="creator-page__header-actions">
            {showCreatorAccount ? <CreatorAccountWidget /> : null}
            {actions && <div className="creator-page__actions">{actions}</div>}
          </div>
        )}
      </header>

      <div className="creator-page__content">{children}</div>
    </div>
  )
}
