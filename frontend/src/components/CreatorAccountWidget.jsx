import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasActiveCreatorAccess } from '../utils/accessStatus'

export default function CreatorAccountWidget({ className = '', role, userName }) {
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const { activeMode, setActiveMode, signOut, user, userProfile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const displayName = userName || userProfile?.profile?.displayName || user?.name || 'Creator'
  const avatarUrl = userProfile?.profile?.avatarUrl
  const displayRole = role || (activeMode === 'creator' && hasActiveCreatorAccess(user) ? 'Creator Mode' : 'User Mode')
  const initial = displayName.trim().charAt(0).toUpperCase() || 'V'

  useEffect(() => {
    function handleDocumentClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)
    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [])

  function goTo(path) {
    navigate(path)
    setMenuOpen(false)
  }

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  function switchToUserMode() {
    setActiveMode('user')
    setMenuOpen(false)
    navigate('/', { replace: true })
  }

  return (
    <div className={`creator-account-widget ${className}`.trim()} aria-label="Creator account actions" ref={menuRef}>
      <button
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`Open creator menu for ${displayName} (${displayRole})`}
        className="creator-account-widget__identity"
        onClick={() => setMenuOpen((current) => !current)}
        type="button"
      >
        <span className="creator-account-widget__avatar" aria-hidden="true">{avatarUrl ? <img alt="" src={avatarUrl} /> : initial}</span>
        <span className="creator-account-widget__profile">
          <strong>{displayName}</strong>
          <span>{displayRole}</span>
        </span>
      </button>

      {menuOpen && (
        <div className="creator-account-widget__menu" role="menu">
          <button onClick={() => goTo('/creator/profile')} role="menuitem" type="button">Profile</button>
          <button onClick={() => goTo('/settings')} role="menuitem" type="button">Settings</button>
          <button onClick={switchToUserMode} role="menuitem" type="button">Switch to User Mode</button>
          <button onClick={handleSignOut} role="menuitem" type="button">Log out</button>
        </div>
      )}
    </div>
  )
}
