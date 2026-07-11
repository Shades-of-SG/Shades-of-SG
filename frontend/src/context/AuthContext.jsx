import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

function readInitialAuth(resetOnPublicEntry) {
  // A direct application entry at the public root must always begin at the
  // guest landing experience. Authenticated routes and in-app navigation do
  // not remount the provider, so normal signed-in workflows remain intact.
  if (resetOnPublicEntry && window.location.pathname === '/') {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    return { token: null, user: null }
  }

  const storedUser = localStorage.getItem('authUser')
  let user = null

  try {
    user = storedUser ? JSON.parse(storedUser) : null
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
      localStorage.setItem('authToken', nextToken)
      localStorage.setItem('authUser', JSON.stringify(nextUser))
      setUser(nextUser)
      setToken(nextToken)
    },
    signOut() {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      setUser(null)
      setToken(null)
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
