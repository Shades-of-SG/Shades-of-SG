import { createContext, useContext, useMemo, useState } from 'react'
import { normalizeUserAccess } from '../utils/accessStatus'

const AuthContext = createContext(null)

function readInitialAuth(resetOnPublicEntry) {
  if (resetOnPublicEntry && window.location.pathname === '/') {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    return { token: null, user: null }
  }

  const storedUser = localStorage.getItem('authUser')
  let user = null
  try {
    user = storedUser ? normalizeUserAccess(JSON.parse(storedUser)) : null
  } catch {
    localStorage.removeItem('authUser')
  }
  return { token: localStorage.getItem('authToken'), user }
}

export function AuthProvider({ children, resetOnPublicEntry = false }) {
  const [initialAuth] = useState(() => readInitialAuth(resetOnPublicEntry))
  const [user, setUser] = useState(initialAuth.user)
  const [token, setToken] = useState(initialAuth.token)

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token),
    signIn(nextUser, nextToken) {
      const normalizedUser = normalizeUserAccess(nextUser)
      localStorage.setItem('authToken', nextToken)
      localStorage.setItem('authUser', JSON.stringify(normalizedUser))
      setUser(normalizedUser)
      setToken(nextToken)
    },
    signOut() {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      setUser(null)
      setToken(null)
    },
    updateUser(nextUser) {
      const normalizedUser = normalizeUserAccess(nextUser)
      localStorage.setItem('authUser', JSON.stringify(normalizedUser))
      setUser(normalizedUser)
    },
  }), [user, token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
