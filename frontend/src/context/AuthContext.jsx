import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { hasActiveCreatorAccess, normalizeUserAccess } from '../utils/accessStatus'
import { getMyUserProfile } from '../services/userProfileService'

const AuthContext = createContext(null)
const ACTIVE_MODE_KEY = 'activeMode'

function readStoredMode() {
  const mode = localStorage.getItem(ACTIVE_MODE_KEY)
  return mode === 'user' || mode === 'creator' ? mode : null
}

function resolveMode(user, requestedMode = readStoredMode()) {
  if (requestedMode === 'user') return 'user'
  if (requestedMode === 'creator' && hasActiveCreatorAccess(user)) return 'creator'
  return hasActiveCreatorAccess(user) ? 'creator' : 'user'
}

function readInitialAuth() {
  const storedUser = localStorage.getItem('authUser')
  let user = null
  try {
    user = storedUser ? normalizeUserAccess(JSON.parse(storedUser)) : null
  } catch {
    localStorage.removeItem('authUser')
  }
  const storedMode = readStoredMode()
  const activeMode = resolveMode(user, storedMode)
  if (user || storedMode) localStorage.setItem(ACTIVE_MODE_KEY, activeMode)
  return { activeMode, token: localStorage.getItem('authToken'), user, userProfile: initialProfileData(user) }
}

function initialProfileData(user) {
  if (!user) return null
  const shared = user.sharedProfile || {}
  return {
    account: { email: user.email, emailVerified: user.emailVerified, isCreator: user.role === 'CREATOR', role: user.role, userId: user.id },
    profile: {
      avatarUrl: shared.avatarUrl || user.avatarUrl || '', bio: shared.bio || user.bio || '',
      createdAt: user.createdAt, displayName: shared.displayName || user.name || 'Account',
      fontSize: shared.fontSize || 'MEDIUM', location: shared.location || '',
      preferredLanguage: shared.preferredLanguage || '', profileVisibility: shared.profileVisibility || 'PUBLIC',
      reducedMotion: shared.reducedMotion || false, showBadges: shared.showBadges ?? true,
      showReflections: shared.showReflections ?? true, showRhythmRanking: shared.showRhythmRanking ?? true,
      theme: shared.theme || 'SYSTEM', userId: user.id,
    },
  }
}

export function AuthProvider({ children }) {
  const [initialAuth] = useState(readInitialAuth)
  const [activeMode, setActiveModeState] = useState(initialAuth.activeMode)
  const [user, setUser] = useState(initialAuth.user)
  const [token, setToken] = useState(initialAuth.token)
  const [userProfile, setUserProfile] = useState(initialAuth.userProfile)
  const [profileLoading, setProfileLoading] = useState(false)

  const refreshProfile = useCallback(async (requestedToken = token) => {
    if (!requestedToken) {
      setUserProfile(null)
      setProfileLoading(false)
      return null
    }
    setProfileLoading(true)
    try {
      const data = await getMyUserProfile(requestedToken)
      if (!data?.profile) throw new Error('Profile data is unavailable.')
      setUserProfile(data)
      return data
    } finally {
      setProfileLoading(false)
    }
  }, [token])

  useEffect(() => {
    const profile = userProfile?.profile
    const root = document.documentElement
    const theme = profile?.theme?.toLowerCase() || 'system'
    root.dataset.userTheme = theme
    root.dataset.userFontSize = profile?.fontSize?.toLowerCase() || 'medium'
    root.classList.toggle('user-prefers-reduced-motion', Boolean(profile?.reducedMotion))
  }, [userProfile])

  const value = useMemo(() => ({
    activeMode,
    user,
    token,
    isAuthenticated: Boolean(token),
    profileLoading,
    refreshProfile,
    userProfile,
    signIn(nextUser, nextToken) {
      const normalizedUser = normalizeUserAccess(nextUser)
      const nextMode = resolveMode(normalizedUser)
      localStorage.setItem('authToken', nextToken)
      localStorage.setItem('authUser', JSON.stringify(normalizedUser))
      localStorage.setItem(ACTIVE_MODE_KEY, nextMode)
      setUser(normalizedUser)
      setToken(nextToken)
      setUserProfile(initialProfileData(normalizedUser))
      setActiveModeState(nextMode)
      return nextMode
    },
    signOut() {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      localStorage.removeItem(ACTIVE_MODE_KEY)
      setUser(null)
      setToken(null)
      setUserProfile(null)
      setProfileLoading(false)
      setActiveModeState('user')
    },
    setActiveMode(nextMode) {
      if (!['user', 'creator'].includes(nextMode)) return false
      if (nextMode === 'creator' && !hasActiveCreatorAccess(user)) return false
      localStorage.setItem(ACTIVE_MODE_KEY, nextMode)
      setActiveModeState(nextMode)
      return true
    },
    updateUser(nextUser) {
      const normalizedUser = normalizeUserAccess(nextUser)
      const nextMode = resolveMode(normalizedUser, activeMode)
      localStorage.setItem('authUser', JSON.stringify(normalizedUser))
      localStorage.setItem(ACTIVE_MODE_KEY, nextMode)
      setUser(normalizedUser)
      setActiveModeState(nextMode)
    },
    updateUserProfile(nextProfileData) {
      setUserProfile((current) => ({ ...current, ...nextProfileData }))
    },
  }), [activeMode, profileLoading, refreshProfile, user, userProfile, token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
