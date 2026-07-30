import { NavLink } from 'react-router-dom'

// Bright glyphs only — a dark silhouette (👤) vanishes against the purple
// gradient of the active tab.
const tabs = [
  { icon: '🪪', label: 'Profile', slug: 'profile' },
  { icon: '🔒', label: 'Account & Security', slug: 'account-security' },
  { icon: '🛡️', label: 'Data & Privacy', slug: 'data-privacy' },
]

export default function SettingsNav({ basePath }) {
  return (
    <nav aria-label="Settings sections" className="settings-nav">
      {tabs.map((tab) => (
        <NavLink
          className={({ isActive }) => `settings-nav__link ${isActive ? 'is-active' : ''}`}
          key={tab.slug}
          to={`${basePath}/${tab.slug}`}
        >
          <span aria-hidden="true" className="settings-nav__icon">{tab.icon}</span>
          <span className="settings-nav__label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
