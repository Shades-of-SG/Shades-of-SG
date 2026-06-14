import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children, isAllowed = true, redirectTo = '/login' }) {
  const location = useLocation()

  if (!isAllowed) {
    return <Navigate replace state={{ from: location }} to={redirectTo} />
  }

  return children || <Outlet />
}
