import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function CreatorLayout() {
  const { pathname } = useLocation()
  const isStudioPage = pathname === '/creator/studio' || pathname.startsWith('/creator/studio/')

  return (
    <div className={`creator-shell ${isStudioPage ? 'creator-shell--studio' : ''}`}>
      <Sidebar />
      <main className={`creator-main creator-workspace ${isStudioPage ? 'creator-main--studio' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
