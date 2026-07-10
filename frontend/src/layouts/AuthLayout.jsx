import { Link, Outlet } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

export default function AuthLayout() {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-label="Authentication">
        <Link className="brand-mark auth-brand" to="/">
          <BrandLogo className="brand-logo--auth" />
        </Link>
        <Outlet />
      </section>
    </main>
  )
}
