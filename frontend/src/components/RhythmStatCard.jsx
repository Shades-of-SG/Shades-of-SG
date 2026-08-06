import useCountUp from '../hooks/useCountUp'

export default function RhythmStatCard({ icon, label, value, suffix = '', isText = false, songTitle, difficulty, loading }) {
  const count = useCountUp(isText ? 0 : value)
  const displayValue = loading ? 'Loading…' : isText ? (value || '—') : `${count}${suffix}`

  return (
    <article className="feature-card rhythm-stat-card">
      <div className="feature-icon">{icon}</div>
      <h3>{displayValue}</h3>
      <p className="rhythm-stat-label">{label}</p>
      <p className="rhythm-stat-song">{loading ? 'Loading…' : (songTitle || 'No attempts yet')}</p>
      {!loading && difficulty ? <p className="rhythm-stat-difficulty">{difficulty}</p> : null}
    </article>
  )
}
