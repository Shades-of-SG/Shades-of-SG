import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navigationByRole = {
  creator: [
    { label: 'Dashboard', to: '/creator/dashboard' },
    { label: 'Studio', to: '/creator/studio' },
    { label: 'Songs', to: '/creator/songs' },
    { label: 'Reflection Moderation', to: '/creator/reflections' },
    { label: 'Profile', to: '/creator/profile' },
    { label: 'Settings', to: '/creator/settings' },
  ],
  guest: [
    { label: 'Home', to: '/' },
    { label: 'Songs', to: '/songs' },
    { label: 'Learning Hub', to: '/learning' },
    { label: 'Rhythm Game', to: '/rhythm-game' },
    { label: 'Reflection Wall', to: '/reflections' },
    { label: 'Login', to: '/login' },
    { label: 'Register', to: '/register' },
  ],
  user: [
    { label: 'Home', to: '/' },
    { label: 'Songs', to: '/songs' },
    { label: 'Learning Hub', to: '/learning' },
    { label: 'Rhythm Game', to: '/rhythm-game' },
    { label: 'Reflection Wall', to: '/reflections' },
    { label: 'Profile', to: '/profile' },
    { label: 'Settings', to: '/settings' },
  ],
}

export default function Navbar({ role = 'guest', variant = 'public' }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const links = navigationByRole[role] || navigationByRole.guest

  function handleLogout() {
    signOut()
    setIsOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <header className={`site-header site-header-${variant}`}>
      <nav className="navbar" aria-label="Primary navigation">
        <Link className="brand-mark" to={role === 'creator' ? '/creator/dashboard' : '/'}>
          <span>SG</span>
          <strong>Shades of SG</strong>
        </Link>

        <button
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
          className="nav-toggle"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-links ${isOpen ? 'open' : ''}`}>
          {links.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              end={item.to === '/'}
              key={item.to}
              onClick={() => setIsOpen(false)}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
          {role !== 'guest' && (
            <button className="nav-action" onClick={handleLogout} type="button">
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
