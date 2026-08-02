const ITEMS = [
  { key: 'pending', label: 'Pending', description: 'Awaiting review', icon: '⌛' },
  { key: 'approved', label: 'Approved', description: 'Visible on the wall', icon: '✓' },
  { key: 'flagged', label: 'Flagged', description: 'Needs attention', icon: '⚑' },
  { key: 'newToday', label: 'New today', description: 'Community submissions', icon: '♡' },
]

export default function ModerationStats({ stats }) {
  return (
    <section aria-label="Moderation overview" className="crm-stats">
      {ITEMS.map((item) => (
        <article className={`crm-stat-card is-${item.key.toLowerCase()}`} key={item.key}>
          <span aria-hidden="true" className="crm-stat-card__icon">{item.icon}</span>
          <div>
            <span>{item.label}</span>
            <strong>{stats[item.key] || 0}</strong>
            <small>{item.key === 'newToday' && stats.newYesterday !== undefined
              ? `${stats.newYesterday || 0} yesterday`
              : item.description}</small>
          </div>
        </article>
      ))}
    </section>
  )
}
