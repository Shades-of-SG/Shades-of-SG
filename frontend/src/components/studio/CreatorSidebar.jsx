import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from '../BrandLogo'

const navigationItems = [
  { label: 'Dashboard', shortLabel: 'DB', to: '/creator/dashboard' },
  { label: 'Studio', shortLabel: 'ST', to: '/creator/studio' },
  { label: 'Songs', shortLabel: 'SG', to: '/creator/songs' },
  { label: 'Reflection Moderation', shortLabel: 'RM', to: '/creator/reflections' },
  { label: 'Profile', shortLabel: 'PR', to: '/creator/profile' },
  { label: 'Settings', shortLabel: 'SE', to: '/creator/settings' },
]

export default function CreatorSidebar({ collapsed = false, drawerOpen = false, isDrawerMode = false, onCloseDrawer, onToggleCollapse }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const drawerStateClass = drawerOpen ? 'is-open' : ''

  function handleLogout() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {isDrawerMode && drawerOpen && <button aria-label="Close Studio navigation" className="studio-sidebar-backdrop" onClick={onCloseDrawer} type="button" />}
      <aside className={`studio-sidebar ${collapsed ? 'is-collapsed' : ''} ${isDrawerMode ? 'is-drawer' : ''} ${drawerStateClass}`}>
        <div className="studio-sidebar__brand">
          <BrandLogo className="brand-logo--creator" compact={collapsed} />
          <div className="studio-sidebar__brand-copy">
            <span>Creator</span>
          </div>
          {!isDrawerMode && (
            <button aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="studio-sidebar__collapse" onClick={onToggleCollapse} type="button">
              {collapsed ? '>' : '<'}
            </button>
          )}
        </div>

        <nav className="studio-sidebar__nav studio-sidebar__nav--topbar" aria-label="Creator navigation">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) => `studio-sidebar__link ${isActive ? 'active' : ''}`}
              key={item.to}
              onClick={isDrawerMode ? onCloseDrawer : undefined}
              to={item.to}
            >
              <span className="studio-sidebar__link-icon" aria-hidden="true">
                {item.shortLabel}
              </span>
              <span className="studio-sidebar__link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="studio-sidebar__footer">
          <button className="studio-sidebar__utility" type="button">
            <span className="studio-sidebar__link-icon" aria-hidden="true">
              ?
            </span>
            <span className="studio-sidebar__link-label">Help &amp; Support</span>
          </button>
          <button className="studio-sidebar__utility" onClick={handleLogout} type="button">
            <span className="studio-sidebar__link-icon" aria-hidden="true">
              O
            </span>
            <span className="studio-sidebar__link-label">Log out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
