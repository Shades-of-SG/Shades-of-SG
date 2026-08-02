import { createContext, useContext, useMemo, useState } from 'react'
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
      return JSON.parse(existingSession)
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  const guestSession = createGuestSession()
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(guestSession))
  return guestSession
}

export function SessionProvider({ children }) {
  const { user } = useAuth()

  // ✅ Only touch the guest session when nobody is signed in. AuthProvider resolves
  // the stored user synchronously, so on a refresh `user` is already known here and
  // a signed-in visitor never gets a stray guest session written to localStorage —
  // only `user` and `token` are kept.
  const [guestSession, setGuestSession] = useState(() => (user ? null : loadGuestSession()))

  const session = user ? null : guestSession

  const value = useMemo(() => ({
    session,
    updateSession(updater) {
      if (user) {
        // Signed-in progress belongs to the account, not to localStorage.
        return
      }

      setGuestSession((currentSession) => {
        const baseSession = currentSession ?? loadGuestSession()
        const nextSession = typeof updater === 'function' ? updater(baseSession) : updater

        if (nextSession) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
        }

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
