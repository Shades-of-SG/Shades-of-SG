import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('authUser')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('authToken'))

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
