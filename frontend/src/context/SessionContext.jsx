import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'

const SESSION_STORAGE_KEY = 'shadesOfSgGuestSession'
const SessionContext = createContext(null)

function createGuestSession() {
  return {
    id: crypto.randomUUID(),
    type: 'guest',
    createdAt: new Date().toISOString(),
    triviaScores: [],
    rhythmScores: [],
  }
}

function loadGuestSession() {
  const existingSession = localStorage.getItem(SESSION_STORAGE_KEY)

  if (existingSession) {
    try {
      const parsedSession = JSON.parse(existingSession)
      if (parsedSession?.type === 'guest' && parsedSession.id) return parsedSession
    } catch {
      // Replace unreadable guest data with a new isolated session below.
    }
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  const guestSession = createGuestSession()
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(guestSession))
  return guestSession
}

export function SessionProvider({ children }) {
  const { user } = useAuth()
  const [guestSession, setGuestSession] = useState(() => (user ? null : loadGuestSession()))

  useEffect(() => {
    if (user) localStorage.removeItem(SESSION_STORAGE_KEY)
    const timer = window.setTimeout(() => {
      setGuestSession((currentSession) => {
        if (user) return null
        return currentSession || loadGuestSession()
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [user])

  const session = user ? null : guestSession

  const value = useMemo(() => ({
    session,
    updateSession(updater) {
      if (user) return
      setGuestSession((currentSession) => {
        const baseSession = currentSession || loadGuestSession()
        const nextSession = typeof updater === 'function' ? updater(baseSession) : updater
        if (nextSession) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
        else localStorage.removeItem(SESSION_STORAGE_KEY)
        return nextSession
      })
    },
  }), [session, user])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }

  return context
}
