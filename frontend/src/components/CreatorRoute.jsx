import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  hasActiveAccount,
  hasActiveCreatorAccess,
} from '../utils/accessStatus'
import AccountAccessSuspended from './AccountAccessSuspended'
import CreatorAccessSuspended from './CreatorAccessSuspended'

export default function CreatorRoute({ children }) {
  const {
    activeMode,
    setActiveMode,
    token,
    user,
  } = useAuth()

  const location = useLocation()

  const creatorSuspended =
    user?.role === 'CREATOR' &&
    hasActiveAccount(user) &&
    !hasActiveCreatorAccess(user)

  useEffect(() => {
    if (
      creatorSuspended &&
      activeMode !== 'user'
    ) {
      setActiveMode('user')
    }
  }, [
    activeMode,
    creatorSuspended,
    setActiveMode,
  ])

  if (!token || !user) {
    return (
      <Navigate
        replace
        state={{
          from: location.pathname,
          sessionExpired: true,
        }}
        to="/"
      />
    )
  }

  if (!hasActiveAccount(user)) {
    return <AccountAccessSuspended />
  }

  if (user.role !== 'CREATOR') {
    return <Navigate replace to="/" />
  }

  if (creatorSuspended) {
    return <CreatorAccessSuspended />
  }

  if (activeMode !== 'creator') {
    return <Navigate replace to="/" />
  }

  return children || <Outlet />
}