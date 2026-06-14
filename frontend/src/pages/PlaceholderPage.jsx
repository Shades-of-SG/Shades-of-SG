import { Link } from 'react-router-dom'

export default function PlaceholderPage({ title, description, actionTo = '/reflections', actionLabel = 'View Reflection Wall' }) {
  return (
    <section className="placeholder-page">
      <p className="eyebrow">Coming Soon</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link to={actionTo}>{actionLabel}</Link>
    </section>
  )
}
