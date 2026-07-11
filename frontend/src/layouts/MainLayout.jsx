import { Outlet, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

export default function MainLayout({ role = 'guest' }) {
  const { pathname } = useLocation()
  const isReflectionWall = pathname === '/reflections'
  const isWidePublicPage = isReflectionWall || pathname === '/profile'

  return (
    <div className="app-shell public-shell">
      <Navbar role={role} />
      <main className={`site-main${isWidePublicPage ? ' site-main--wide' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
