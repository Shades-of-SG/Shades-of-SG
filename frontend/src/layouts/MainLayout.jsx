import { Compass, Gamepad2, Home, MessageSquareHeart, Music2 } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

export default function MainLayout({ role = 'guest' }) {
  const { pathname } = useLocation()

  const isReflectionWall = pathname === '/reflections'
  const isProfile = pathname === '/profile'
  const isPublicCreatorProfile = pathname.startsWith('/creators/')
  const isPublicUserProfile = pathname.startsWith('/users/')
  const isSongsLibrary = pathname === '/songs'
  const isAccountSettings = pathname === '/settings'

  return (
    <div className="app-shell public-shell">
      <Navbar role={role} />

      <main
        className={`site-main${
          isReflectionWall || isProfile || isPublicCreatorProfile || isPublicUserProfile
            ? ' site-main--wide'
            : ''
        }${
          isSongsLibrary ? ' site-main--songs' : ''
        }${
          isAccountSettings ? ' site-main--account' : ''
        }`}
      >
        <Outlet />
      </main>

      <Footer />

      <nav aria-label="Exhibition navigation" className="holobox-dock">
        <NavLink
          className={({ isActive }) => `holobox-dock__item${isActive ? ' active' : ''}`}
          end
          to="/"
        >
          <Home aria-hidden="true" size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `holobox-dock__item${isActive ? ' active' : ''}`}
          to="/songs"
        >
          <Music2 aria-hidden="true" size={22} />
          <span>Songs</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `holobox-dock__item${isActive ? ' active' : ''}`}
          to="/learning"
        >
          <Compass aria-hidden="true" size={22} />
          <span>Learn</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `holobox-dock__item${isActive ? ' active' : ''}`}
          to="/rhythm-game"
        >
          <Gamepad2 aria-hidden="true" size={22} />
          <span>Rhythm</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `holobox-dock__item${isActive ? ' active' : ''}`}
          to="/reflections"
        >
          <MessageSquareHeart aria-hidden="true" size={22} />
          <span>Wall</span>
        </NavLink>
      </nav>
    </div>
  )
}
