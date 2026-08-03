import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import CreatorAccessSuspended from '../components/CreatorAccessSuspended'
import { useAuth } from '../context/AuthContext'
import { hasActiveCreatorAccess } from '../utils/accessStatus'

export default function CreatorLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isStudioPage = pathname === '/creator/studio' || pathname.startsWith('/creator/studio/')

  if (!hasActiveCreatorAccess(user)) return <CreatorAccessSuspended />

  return (
    <div className={`creator-shell ${isStudioPage ? 'creator-shell--studio' : ''}`}>
      <Sidebar />
      <main className={`creator-main creator-workspace ${isStudioPage ? 'creator-main--studio' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
