import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children, isAllowed = true, isLoading = false, loadingFallback = null, redirectTo = '/login' }) {
  const location = useLocation()

  if (isLoading) return loadingFallback || <p aria-live="polite" role="status">Restoring your session&hellip;</p>

  if (!isAllowed) {
    return <Navigate replace state={{ from: location }} to={redirectTo} />
  }

  return children || <Outlet />
}
