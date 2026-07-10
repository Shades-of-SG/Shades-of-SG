import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandLogo from './BrandLogo'

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

  if (role === 'guest' && variant === 'public') {
    const primaryLinks = links.filter((item) => !['Login', 'Register'].includes(item.label))

    return (
      <header className="site-header site-header-public site-header-public--guest">
        <nav className="navbar guest-navbar" aria-label="Primary navigation">
          <Link className="brand-mark guest-navbar__brand" to="/">
            <BrandLogo className="brand-logo--navbar" />
          </Link>

          <div className={`guest-navbar__menu ${isOpen ? 'open' : ''}`}>
            <div className="guest-navbar__primary">
              {primaryLinks.map((item) => (
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
            </div>

            <div className="guest-navbar__auth">
              <NavLink className="guest-navbar__login" onClick={() => setIsOpen(false)} to="/login">
                Login
              </NavLink>
              <NavLink className="guest-navbar__register" onClick={() => setIsOpen(false)} to="/register">
                Register
              </NavLink>
            </div>
          </div>

          <button
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
            className="nav-toggle guest-navbar__toggle"
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </header>
    )
  }

  return (
    <header className={`site-header site-header-${variant}`}>
      <nav className="navbar" aria-label="Primary navigation">
        <Link className="brand-mark" to={role === 'creator' ? '/creator/dashboard' : '/'}>
          <BrandLogo className="brand-logo--navbar" />
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
              className={({ isActive }) => {
                const accountClass = role === 'guest' && ['Login', 'Register'].includes(item.label)
                  ? ` nav-link--${item.label.toLowerCase()}`
                  : ''
                return `${isActive ? 'active' : ''}${accountClass}`.trim() || undefined
              }}
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
