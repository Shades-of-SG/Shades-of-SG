import { useEffect, useRef, useState } from 'react'
import { LogOut, Pencil, Settings, UserRound } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandLogo from './BrandLogo'
import '../Navbar.css'

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
  ],
}

export default function Navbar({ role = 'guest', variant = 'public' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const accountRef = useRef(null)
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const links = navigationByRole[role] || navigationByRole.guest
  const displayName = user?.name || 'Account'
  const avatarUrl = user?.avatarUrl || user?.avatar_url || '/images/Default_pfp.jpg'

  useEffect(() => {
    function closeAccountMenu(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountOpen(false)
      }
    }

    function closeMenusOnEscape(event) {
      if (event.key === 'Escape') {
        setIsAccountOpen(false)
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeAccountMenu)
    document.addEventListener('keydown', closeMenusOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeAccountMenu)
      document.removeEventListener('keydown', closeMenusOnEscape)
    }
  }, [])

  function handleLogout() {
    signOut()
    setIsOpen(false)
    setIsAccountOpen(false)
    navigate('/login', { replace: true })
  }

  if (['guest', 'user'].includes(role) && variant === 'public') {
    const primaryLinks = links.filter((item) => !['Login', 'Register'].includes(item.label))
    const isRegistered = role === 'user'

    return (
      <header className={`site-header site-header-public site-header-public--guest${isRegistered ? ' site-header-public--registered' : ''}`}>
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

            {isRegistered ? (
              <div className="public-navbar__utilities">
                <div className="registered-navbar__account" ref={accountRef}>
                  <button
                    aria-expanded={isAccountOpen}
                    aria-haspopup="menu"
                    aria-label={`Open user menu for ${displayName}`}
                    className="registered-navbar__account-button"
                    onClick={() => setIsAccountOpen((current) => !current)}
                    type="button"
                  >
                    <span className="registered-navbar__avatar" aria-hidden="true">
                      <img alt="" src={avatarUrl} />
                    </span>
                  </button>

                  {isAccountOpen ? (
                    <div className="registered-navbar__dropdown" role="menu">
                      <strong className="registered-navbar__menu-title">USER MENU</strong>
                      <Link onClick={() => { setIsAccountOpen(false); setIsOpen(false) }} role="menuitem" to="/profile">
                        <UserRound aria-hidden="true" size={18} /> View Profile
                      </Link>
                      <Link onClick={() => { setIsAccountOpen(false); setIsOpen(false) }} role="menuitem" to="/settings#profile">
                        <Pencil aria-hidden="true" size={18} /> Edit Profile
                      </Link>
                      <Link onClick={() => { setIsAccountOpen(false); setIsOpen(false) }} role="menuitem" to="/settings">
                        <Settings aria-hidden="true" size={18} /> Settings
                      </Link>
                      <button onClick={handleLogout} role="menuitem" type="button">
                        <LogOut aria-hidden="true" size={18} /> Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="guest-navbar__auth">
                <NavLink className="guest-navbar__login" onClick={() => setIsOpen(false)} to="/login">
                  Login
                </NavLink>
                <NavLink className="guest-navbar__register" onClick={() => setIsOpen(false)} to="/register">
                  Register
                </NavLink>
              </div>
            )}
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
