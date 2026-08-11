import { useEffect, useRef, useState } from 'react'
import { Check, Languages, LogOut, Repeat2, Settings, UserRound } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandLogo from './BrandLogo'
import '../Navbar.css'
import { CREATOR_SUSPENSION_MESSAGE, hasActiveCreatorAccess, hasSuspendedCreatorAccess } from '../utils/accessStatus'

const navigationByRole = {
  creator: [
    { label: 'Dashboard', to: '/creator/dashboard' },
    { label: 'Studio', to: '/creator/studio/new' },
    { label: 'Songs', to: '/creator/songs' },
    { label: 'Reflection Moderation', to: '/creator/reflections' },
    { label: 'Profile', to: '/creator/profile' },
    { label: 'Settings', to: '/settings' },
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
    { label: 'Reflection Wall', to: '/reflections' }
  ],
}

const TRANSLATE_ELEMENT_ID = 'google_translate_element'
const TRANSLATE_SCRIPT_ID = 'google-translate-script'
const LANGUAGE_KEY = 'shadesOfSgLanguage'
const supportedLanguages = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: 'Chinese' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'ta', label: 'Tamil' },
]

function applyGoogleLanguage(language) {
  const googleSelect = document.querySelector(`#${TRANSLATE_ELEMENT_ID} select`)
  if (!googleSelect) return false
  googleSelect.value = language
  googleSelect.dispatchEvent(new Event('change'))
  return true
}

function LanguageSelector() {
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'en')
  const [isOpen, setIsOpen] = useState(false)
  const languageRef = useRef(null)

  useEffect(() => {
    function closeLanguageMenu(event) {
      if (languageRef.current && !languageRef.current.contains(event.target)) setIsOpen(false)
    }

    function closeLanguageMenuOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', closeLanguageMenu)
    document.addEventListener('keydown', closeLanguageMenuOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeLanguageMenu)
      document.removeEventListener('keydown', closeLanguageMenuOnEscape)
    }
  }, [])

  useEffect(() => {
    function initialiseTranslate() {
      if (!window.google?.translate?.TranslateElement) return
      const host = document.getElementById(TRANSLATE_ELEMENT_ID)
      if (!host || host.querySelector('select')) return

      new window.google.translate.TranslateElement({
        autoDisplay: false,
        includedLanguages: supportedLanguages.map((item) => item.code).join(','),
        pageLanguage: 'en',
      }, TRANSLATE_ELEMENT_ID)
    }

    window.googleTranslateElementInit = initialiseTranslate
    if (window.google?.translate?.TranslateElement) initialiseTranslate()
    else if (!document.getElementById(TRANSLATE_SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = TRANSLATE_SCRIPT_ID
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    }

    let attempts = 0
    const restoreLanguage = window.setInterval(() => {
      attempts += 1
      if (applyGoogleLanguage(localStorage.getItem(LANGUAGE_KEY) || 'en') || attempts >= 40) {
        window.clearInterval(restoreLanguage)
      }
    }, 250)

    return () => {
      window.clearInterval(restoreLanguage)
    }
  }, [])

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage)
    setIsOpen(false)
    localStorage.setItem(LANGUAGE_KEY, nextLanguage)
    applyGoogleLanguage(nextLanguage)
  }

  return (
    <div className="navbar-language" ref={languageRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Translate website"
        className="navbar-language__button"
        onClick={() => setIsOpen((current) => !current)}
        title="Translate website"
        type="button"
      >
        <Languages aria-hidden="true" size={22} />
      </button>
      {isOpen ? (
        <div aria-label="Choose a language" className="navbar-language__dropdown" role="menu">
          {supportedLanguages.map((item) => (
            <button
              aria-checked={language === item.code}
              className={language === item.code ? 'is-active' : undefined}
              key={item.code}
              onClick={() => changeLanguage(item.code)}
              role="menuitemradio"
              type="button"
            >
              <span>{item.label}</span>
              {language === item.code ? <Check aria-hidden="true" size={17} /> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div aria-hidden="true" className="google-translate-host" id={TRANSLATE_ELEMENT_ID} />
    </div>
  )
}

export default function Navbar({ role = 'guest', variant = 'public' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const accountRef = useRef(null)
  const navigate = useNavigate()
  const { activeMode, setActiveMode, signOut, user, userProfile } = useAuth()
  const links = navigationByRole[role] || navigationByRole.guest
  const displayName = userProfile?.profile?.displayName || user?.name || 'Account'
  const avatarUrl = userProfile?.profile?.avatarUrl || user?.avatarUrl || user?.avatar_url || '/images/Default_pfp.jpg'
  const creatorActive = hasActiveCreatorAccess(user)
  const creatorSuspended = hasSuspendedCreatorAccess(user)

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

  function switchToCreatorMode() {
    if (user?.role !== 'CREATOR' || !hasActiveCreatorAccess(user)) return
    if (!setActiveMode('creator')) return
    setIsOpen(false)
    setIsAccountOpen(false)
    navigate('/creator/dashboard')
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
                <LanguageSelector />
                <span className="registered-navbar__name">{displayName}</span>
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
                      <div className="registered-navbar__menu-identity">
                        <strong>{displayName}</strong>
                        <span>{activeMode === 'creator' ? 'Creator Mode' : 'User Mode'}</span>
                      </div>
                      <Link onClick={() => { setIsAccountOpen(false); setIsOpen(false) }} role="menuitem" to="/profile">
                        <UserRound aria-hidden="true" size={18} /> View Profile
                      </Link>
                      <Link onClick={() => { setIsAccountOpen(false); setIsOpen(false) }} role="menuitem" to="/settings">
                        <Settings aria-hidden="true" size={18} /> Settings
                      </Link>
                      {creatorActive ? <button className="registered-navbar__mode-switch" onClick={switchToCreatorMode} role="menuitem" type="button"><Repeat2 aria-hidden="true" size={18} />Switch to Creator Mode</button> : null}
                      {user?.role === 'REGISTERED' ? <Link onClick={() => { setIsAccountOpen(false); setIsOpen(false) }} role="menuitem" to="/apply/creator">Apply to be a creator</Link> : null}
                      {creatorSuspended ? <div className="registered-navbar__creator-suspended" role="status">{CREATOR_SUSPENSION_MESSAGE}{user?.creatorSuspensionReason ? ` ${user.creatorSuspensionReason}` : ''}</div> : null}
                      <button className="registered-navbar__logout" onClick={handleLogout} role="menuitem" type="button">
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
        {creatorSuspended ? <div className="creator-access-banner" role="status">{CREATOR_SUSPENSION_MESSAGE}</div> : null}
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
