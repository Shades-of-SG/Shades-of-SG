import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { hasActiveCreatorAccess, normalizeUserAccess } from '../utils/accessStatus'
import { getMyUserProfile } from '../services/userProfileService'
import { AUTH_EXPIRED_EVENT } from '../utils/authEvents'
const AuthContext = createContext(null)
const ACTIVE_MODE_KEY = 'activeMode'
const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'
const GUEST_SESSION_KEY = 'shadesOfSgGuestSession'

function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

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
  const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
  const storedUser = localStorage.getItem(AUTH_USER_KEY)
  let user = null

  if (storedToken && storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser)
      if (!parsedUser || typeof parsedUser !== 'object' || Array.isArray(parsedUser) || !parsedUser.id || !parsedUser.role) {
        throw new Error('Stored auth user is invalid.')
      }
      user = normalizeUserAccess(parsedUser)
    } catch {
      clearStoredAuth()
    }
  } else if (storedToken || storedUser) {
    clearStoredAuth()
  }

  const storedMode = readStoredMode()
  const activeMode = resolveMode(user, storedMode)
  if (user || storedMode) localStorage.setItem(ACTIVE_MODE_KEY, activeMode)
  return { activeMode, token: user ? storedToken : null, user, userProfile: initialProfileData(user) }
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
      interestTags: Array.isArray(shared.interestTags) ? shared.interestTags : [],
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

  useEffect(() => {
    function handleAuthExpired() {
      const lastMode = activeMode === 'creator' ? 'creator' : 'user'
      localStorage.setItem(ACTIVE_MODE_KEY, lastMode)
      clearStoredAuth()
      setUser(null)
      setToken(null)
      setUserProfile(null)
      setProfileLoading(false)
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)

    return () => {
      window.removeEventListener(
      AUTH_EXPIRED_EVENT,
      handleAuthExpired
      )
    }
  }, [activeMode])

  const refreshProfile = useCallback(async (requestedToken = token) => {
    if (!requestedToken) {
      setUserProfile(null)
      setProfileLoading(false)
      return null
    }

    setProfileLoading(true)

    try {
      const data = await getMyUserProfile(requestedToken)

      if (!data?.profile) {
        throw new Error('Profile data is unavailable.')
      }

      setUserProfile(data)
      return data
    } finally {
      setProfileLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    const timer = window.setTimeout(() => {
      refreshProfile(token).catch((error) => {
        console.error('[Profile refresh]', error)
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [token, refreshProfile])

  useEffect(() => {
    const profile = userProfile?.profile
    const root = document.documentElement
    const theme = profile?.theme?.toLowerCase() || 'system'

    root.dataset.userTheme = theme
    root.dataset.userFontSize =
      profile?.fontSize?.toLowerCase() || 'medium'

    root.classList.toggle(
      'user-prefers-reduced-motion',
      Boolean(profile?.reducedMotion)
    )
  }, [userProfile])

  const signIn = useCallback((nextUser, nextToken) => {
    const normalizedUser = normalizeUserAccess(nextUser)
    const nextMode = resolveMode(normalizedUser)
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser))
    localStorage.setItem(ACTIVE_MODE_KEY, nextMode)
    localStorage.removeItem(GUEST_SESSION_KEY)
    setUser(normalizedUser)
    setToken(nextToken)
    setUserProfile(initialProfileData(normalizedUser))
    setActiveModeState(nextMode)
    return nextMode
  }, [])

  const signOut = useCallback(() => {
    const lastMode = activeMode === 'creator' ? 'creator' : 'user'
    localStorage.setItem(ACTIVE_MODE_KEY, lastMode)
    clearStoredAuth()
    setUser(null)
    setToken(null)
    setUserProfile(null)
    setProfileLoading(false)
  }, [activeMode])

  const setActiveMode = useCallback((nextMode) => {
    if (!['user', 'creator'].includes(nextMode)) return false
    if (nextMode === 'creator' && !hasActiveCreatorAccess(user)) return false
    localStorage.setItem(ACTIVE_MODE_KEY, nextMode)
    setActiveModeState(nextMode)
    return true
  }, [user])

  const updateUser = useCallback((nextUser) => {
    const normalizedUser = normalizeUserAccess(nextUser)
    const nextMode = resolveMode(normalizedUser, activeMode)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser))
    localStorage.setItem(ACTIVE_MODE_KEY, nextMode)
    setUser(normalizedUser)
    setActiveModeState(nextMode)
  }, [activeMode])

  const updateUserProfile = useCallback((nextProfileData) => {
    setUserProfile((current) => ({ ...current, ...nextProfileData }))
  }, [])

  const value = useMemo(() => ({
    activeMode,
    user,
    token,
    isAuthenticated: Boolean(token && user),
    profileLoading,
    refreshProfile,
    userProfile,
    setActiveMode,
    signIn,
    signOut,
    updateUser,
    updateUserProfile,
  }), [activeMode, profileLoading, refreshProfile, setActiveMode, signIn, signOut, token, updateUser, updateUserProfile, user, userProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
