import useCountUp from '../hooks/useCountUp'

export default function StatCard({ icon, value, suffix = '', label, description }) {
  const count = useCountUp(value)

  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{count}{suffix} {label}</h3>
      <p>{description}</p>
    </article>
  )
}
