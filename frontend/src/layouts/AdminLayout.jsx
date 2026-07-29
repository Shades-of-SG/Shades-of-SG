import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  ['/admin', 'Overview'], ['/admin/applications', 'Applications'], ['/admin/creators', 'Creators'],
  ['/admin/songs', 'Songs'], ['/admin/reflections', 'Reflections'], ['/admin/folders', 'Collections'], ['/admin/governance', 'Governance'],
]

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const logout = () => { signOut(); navigate('/login', { replace: true }) }
  return <div className="creator-shell"><aside className="creator-sidebar"><div className="creator-sidebar__brand"><img alt="Shades of SG Admin" className="creator-sidebar__brand-image" src="/images/Brand%20Logo.png" /></div><div className="creator-sidebar__section-label">Admin Console</div><nav aria-label="Admin navigation" className="creator-sidebar__nav">{links.map(([to, label]) => <NavLink className={({ isActive }) => `creator-sidebar__link ${isActive ? 'active' : ''}`} end={to === '/admin'} key={to} to={to}><span className="creator-sidebar__label">{label}</span></NavLink>)}</nav><div className="creator-sidebar__footer"><button className="creator-sidebar__utility" onClick={logout} type="button">Log out</button></div></aside><main className="creator-main creator-workspace"><Outlet /></main></div>
}
