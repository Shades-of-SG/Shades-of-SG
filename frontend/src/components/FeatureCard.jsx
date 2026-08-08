import { Link } from 'react-router-dom'

export default function FeatureCard({ icon, title, description, to }) {
  const content = (
    <>
      <span aria-hidden="true" className="feature-icon">
        {icon}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </>
  )

  if (to) {
    return (
      <Link className="feature-card feature-card--link" to={to}>
        {content}
      </Link>
    )
  }

  return <article className="feature-card">{content}</article>
}
