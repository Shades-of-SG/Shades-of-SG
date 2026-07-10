import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

export default function PlaceholderPage({ title, description, actionTo = '/reflections', actionLabel = 'View Reflection Wall' }) {
  return (
    <section className="placeholder-page">
      <Link aria-label="Shades of SG home" className="placeholder-brand" to="/"><BrandLogo className="brand-logo--placeholder" /></Link>
      <p className="eyebrow">Coming Soon</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link to={actionTo}>{actionLabel}</Link>
    </section>
  )
}
