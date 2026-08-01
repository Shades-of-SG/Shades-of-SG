import { Link, Outlet, useLocation } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

export default function AuthLayout() {
  const { pathname } = useLocation()
  const isRegister = pathname === '/register'

  return (
    <main className={`auth-shell${isRegister ? ' auth-shell--register' : ''}`}>
      <section className="auth-visual" aria-label="Shades of SG">
        <Link aria-label="Shades of SG home" className="auth-brand" to="/">
          <BrandLogo className="brand-logo--auth" />
        </Link>
        <div className="auth-visual__copy">
          <h1>Where music<br />meets <span>culture.</span></h1>
          <p>A platform that celebrates Singapore&rsquo;s vibrant soundscape and connects creators, fans, and communities.</p>
        </div>
        <div aria-hidden="true" className="auth-visual__skyline" />
        <div aria-hidden="true" className="auth-visual__waves" />
      </section>
      <section className={`auth-card${isRegister ? ' auth-card--register' : ''}`} aria-label="Authentication">
        <Outlet />
      </section>
    </main>
  )
}
