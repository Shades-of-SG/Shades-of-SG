import { useState } from 'react'
import { Bell, ChevronDown, ChevronLeft, ChevronRight, History, LayoutDashboard, LogOut, Menu, Music2, ShieldCheck, UserRound, Users } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../components/admin/AdminUI.css'

const navigation = [
  { icon: LayoutDashboard, label: 'Overview', to: '/admin' },
  { icon: UserRound, label: 'Users', to: '/admin/users' },
  { icon: Users, label: 'Creators', to: '/admin/creators' },
  { icon: Music2, label: 'Content', to: '/admin/content' },
  { icon: ShieldCheck, label: 'Safety & Reports', to: '/admin/community' },
]

const pageTitles = {
  '/admin': 'Overview', '/admin/activity': 'Audit history', '/admin/community': 'Safety & Reports',
  '/admin/content': 'Content', '/admin/creators': 'Creators', '/admin/users': 'Users',
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === 'true')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const current = pageTitles[pathname] || (pathname.startsWith('/admin/users/') ? 'Users' : 'Overview')

  function toggleSidebar() {
    if (window.matchMedia('(max-width: 760px)').matches) {
      setDrawerOpen((value) => !value)
      return
    }
    setCollapsed((value) => {
      localStorage.setItem('adminSidebarCollapsed', String(!value))
      return !value
    })
  }

  function logout() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`admin-shell ${collapsed ? 'is-collapsed' : ''}`}>
      {drawerOpen ? <button aria-label="Close navigation" className="admin-mobile-backdrop" onClick={() => setDrawerOpen(false)} type="button" /> : null}
      <aside className={`admin-sidebar ${drawerOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar__brand">
          <img alt="Shades of SG" src="/images/Brand%20Logo.png" />
        </div>
        <nav aria-label="Admin navigation" className="admin-sidebar__nav">
          {navigation.map(({ icon: Icon, label, to }) => (
            <NavLink className={({ isActive }) => `admin-sidebar__link ${isActive ? 'active' : ''}`} end={to === '/admin'} key={to} onClick={() => setDrawerOpen(false)} title={collapsed ? label : undefined} to={to}>
              <Icon aria-hidden="true" /><span className="admin-sidebar__label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <button className="admin-sidebar__logout" onClick={logout} title={collapsed ? 'Log out' : undefined} type="button"><LogOut /><span className="admin-sidebar__label">Log out</span></button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__context">
            <button aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="admin-topbar__menu" onClick={toggleSidebar} type="button">
              <Menu className="admin-mobile-menu" />
              {collapsed ? <ChevronRight className="admin-desktop-collapse" /> : <ChevronLeft className="admin-desktop-collapse" />}
            </button>
            <div className="admin-topbar__crumb"><span>Admin</span><i aria-hidden="true">/</i><strong>{current}</strong></div>
          </div>
          <div className="admin-topbar__right">
            <NavLink aria-label="Escalated community reports" className="admin-topbar__icon admin-topbar__pending" to="/admin/community?tab=reports"><Bell /></NavLink>
            <button aria-expanded={profileOpen} aria-haspopup="menu" className="admin-profile" onClick={() => setProfileOpen((value) => !value)} title={user?.email || ''} type="button">
              <div className="admin-profile__avatar">{String(user?.name || 'A').slice(0, 2).toUpperCase()}</div>
              <span><strong>{user?.name || 'Administrator'}</strong>{user?.email || 'Administrator profile'}</span><ChevronDown />
            </button>
            {profileOpen ? <div className="admin-profile-menu" role="menu"><p><strong>{user?.name || 'Administrator'}</strong><span>{user?.email}</span></p><NavLink onClick={() => setProfileOpen(false)} role="menuitem" to="/admin/activity"><History />Audit history</NavLink><button onClick={logout} role="menuitem" type="button"><LogOut />Log out</button></div> : null}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
