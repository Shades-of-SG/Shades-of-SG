import { Outlet, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

export default function MainLayout({ role = 'guest' }) {
  const { pathname } = useLocation()
  const isReflectionWall = pathname === '/reflections'

  return (
    <div className="app-shell public-shell">
      <Navbar role={role} />
      <main className={`site-main${isReflectionWall ? ' site-main--wide' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
