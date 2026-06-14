import { Outlet, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

export default function MainLayout({ role = 'guest' }) {
  const { pathname } = useLocation()
  const isReflectionWall = pathname === '/reflections'

  return (
    <div className={`app-shell public-shell${isReflectionWall ? ' reflection-shell' : ''}`}>
      {!isReflectionWall && <Navbar role={role} />}
      <main className="site-main">
        <Outlet />
      </main>
      {!isReflectionWall && <Footer />}
    </div>
  )
}
