import CreatorAccountWidget from './CreatorAccountWidget'

export default function CreatorPageShell({ actions, breadcrumbs = [], children, className = '', description, eyebrow = 'Creator Portal', title }) {
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

        <div className="creator-page__header-actions">
          <CreatorAccountWidget />
          {actions && <div className="creator-page__actions">{actions}</div>}
        </div>
      </header>

      <div className="creator-page__content">{children}</div>
    </div>
  )
}
