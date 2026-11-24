import { NavLink } from 'react-router-dom'
import { Cpu, LayoutDashboard, MessageSquareHeart, Music2, PenSquare } from 'lucide-react'

const creatorLinks = [
  { icon: 'dashboard', label: 'Dashboard', to: '/creator/dashboard' },
  { icon: 'music', label: 'My Songs', to: '/creator/songs' },
  { icon: 'edit', label: 'Studio', to: '/creator/studio/new' },
  { icon: 'jobs', label: 'Generation Jobs', to: '/creator/generation' },
  { icon: 'reflection', label: 'Reflections', to: '/creator/reflections' },
]

const SIDEBAR_ICONS = {
  dashboard: LayoutDashboard,
  edit: PenSquare,
  jobs: Cpu,
  music: Music2,
  reflection: MessageSquareHeart,
}

function SidebarIcon({ type }) {
  const Icon = SIDEBAR_ICONS[type] || LayoutDashboard
  return <Icon aria-hidden="true" size={20} />
}

export default function Sidebar() {

  return (
    <aside className="creator-sidebar">
      <NavLink
        aria-label="Shades of SG creator dashboard"
        className="creator-sidebar__brand"
        to="/creator/dashboard"
      >
        <img
          className="creator-sidebar__brand-image"
          src="/images/Brand%20Logo.png"
          alt="Shades of SG Creator"
        />
      </NavLink>

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
    </aside>
  )
}
