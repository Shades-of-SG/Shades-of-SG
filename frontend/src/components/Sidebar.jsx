import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const creatorLinks = [
  { icon: 'dashboard', label: 'Dashboard', to: '/creator/dashboard' },
  { icon: 'music', label: 'My Songs', to: '/creator/songs' },
  { icon: 'edit', label: 'Studio', to: '/creator/studio' },
  { icon: 'jobs', label: 'Generation Jobs', to: '/creator/generation' },
  { icon: 'reflection', label: 'Reflections', to: '/creator/reflections' },
  { icon: 'profile', label: 'Profile', to: '/creator/profile' },
  { icon: 'settings', label: 'Settings', to: '/creator/settings' },
]

function SidebarIcon({ type }) {
  switch (type) {
    case 'dashboard':
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1.2" />
          <rect x="11" y="3.5" width="5.5" height="3.4" rx="1.2" />
          <rect x="11" y="8" width="5.5" height="8.5" rx="1.2" />
          <rect x="3.5" y="11" width="5.5" height="5.5" rx="1.2" />
        </svg>
      )

    case 'music':
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M12.5 4.5v7.5a2.5 2.5 0 1 1-1.6-2.34V5.9l6-1.2v5.1a2.5 2.5 0 1 1-1.6-2.34V4.05l-2.8.45Z" />
        </svg>
      )

    case 'edit':
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M4.5 13.7V16h2.3l8.2-8.2-2.3-2.3-8.2 8.2Z" />
          <path d="m12 5.2 2.8 2.8" />
        </svg>
      )

    case 'jobs':
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M5 5.5h10M5 10h10M5 14.5h6" />
          <circle cx="15.5" cy="5.5" r="1.1" />
          <circle cx="12.8" cy="14.5" r="1.1" />
        </svg>
      )

    case 'reflection':
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M4.5 4.8h11a1.2 1.2 0 0 1 1.2 1.2v5a1.2 1.2 0 0 1-1.2 1.2h-5.8L6.2 16v-3.8H4.5a1.2 1.2 0 0 1-1.2-1.2V6a1.2 1.2 0 0 1 1.2-1.2Z" />
        </svg>
      )

    case 'profile':
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M10 10a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" />
          <path d="M4.5 16.2a5.5 5.5 0 0 1 11 0" />
        </svg>
      )

    case 'settings':
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="m10 3.5.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3L10 3.5Z" />
          <circle cx="10" cy="10" r="2.6" />
        </svg>
      )
  }
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="creator-sidebar">
      <div className="creator-sidebar__brand">
        <img
          className="creator-sidebar__brand-image"
          src="/images/Brand%20Logo.png"
          alt="Shades of SG Creator"
        />
      </div>

      <div className="creator-sidebar__section-label">
        Creator Portal
      </div>

      <nav
        aria-label="Creator navigation"
        className="creator-sidebar__nav"
      >
        {creatorLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `creator-sidebar__link ${isActive ? 'active' : ''}`
            }
          >
            <span
              className="creator-sidebar__icon"
              aria-hidden="true"
            >
              <SidebarIcon type={item.icon} />
            </span>

            <span className="creator-sidebar__label">
              {item.label}
            </span>

            {item.badge && (
              <span className="creator-sidebar__badge">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div
        className="creator-sidebar__art"
        aria-hidden="true"
      />

      <div className="creator-sidebar__footer">
        <button
          className="creator-sidebar__utility"
          type="button"
        >
          <span
            className="creator-sidebar__utility-icon creator-sidebar__utility-icon--help"
            aria-hidden="true"
          />
          <span>Help &amp; Support</span>
        </button>
        <button
          className="creator-sidebar__utility"
          type="button"
          onClick={handleLogout}
        >
          <span
            className="creator-sidebar__utility-icon creator-sidebar__utility-icon--logout"
            aria-hidden="true"
          />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  )
}
