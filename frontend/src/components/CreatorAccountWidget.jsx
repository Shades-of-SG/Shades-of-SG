export default function CreatorAccountWidget({ className = '', notificationCount = 3, role = 'Creator', userName = role === 'Creator' ? 'Violet' : 'Ferlyn' }) {
  const initial = userName.trim().charAt(0).toUpperCase() || 'V'

  return (
    <div className={`creator-account-widget ${className}`.trim()} aria-label="Creator account actions">
      <button className="creator-account-widget__button" type="button" aria-label="Dark mode">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 4a8 8 0 1 0 0 16c2.2 0 4-3.6 4-8s-1.8-8-4-8Z" />
        </svg>
      </button>

      <button className="creator-account-widget__button creator-account-widget__notification" type="button" aria-label="Notifications">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M9 18V5l10-2v13" />
          <circle cx="7" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
        </svg>
        {notificationCount > 0 && <span>{notificationCount}</span>}
      </button>

      <div className="creator-account-widget__avatar" aria-hidden="true">
        {initial}
      </div>

      <div className="creator-account-widget__profile">
        <strong>{userName}</strong>
        <span>{role}</span>
      </div>
    </div>
  )
}
