import { EmptyState, LoadingRows } from './AdminUI'

function fullDate(value) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-SG', { dateStyle: 'long', timeZone: 'UTC' })
}

export default function ListeningActivityChart({ error = '', loading = false, onRetry, series = [] }) {
  if (loading) {
    return <div aria-label="Loading listening activity" className="admin-chart-state" role="status"><LoadingRows count={3} /></div>
  }

  if (error) {
    return <div className="admin-chart-state is-error" role="alert"><strong>Listening activity could not be loaded.</strong><p>{error}</p><button className="admin-button admin-button--ghost" onClick={onRetry} type="button">Try again</button></div>
  }

  const normalized = series.map((day) => ({
    ...day,
    playbacks: Number(day.playbacks || 0),
    views: Number(day.views || 0),
  }))
  const hasData = normalized.some((day) => day.views || day.playbacks)
  if (!hasData) {
    return <EmptyState description="Views and playback starts will appear once listeners interact with songs." title="No listening activity yet" />
  }

  const maximum = Math.max(1, ...normalized.flatMap((day) => [day.views, day.playbacks]))

  return <div className="admin-time-chart">
    <div aria-label="Chart legend" className="admin-chart-legend"><span>Song views</span><span>Playback starts</span></div>
    <div aria-label="Listening activity for the last seven days" className="admin-chart-plot">
      {normalized.map((day, index) => {
        const dateLabel = fullDate(day.date)
        const tooltipId = `listening-tooltip-${day.date}`
        const edgeClass = index === 0 ? 'is-first' : index === normalized.length - 1 ? 'is-last' : ''
        return <div className={`admin-chart-day ${edgeClass}`} key={day.date}>
          <button
            aria-describedby={tooltipId}
            aria-label={`${dateLabel}: ${day.views} song views and ${day.playbacks} playback starts`}
            className="admin-chart-point"
            type="button"
          >
            <span aria-hidden="true" className="admin-chart-bars">
              <i style={{ height: `${Math.max(2, (day.views / maximum) * 100)}%` }} />
              <i style={{ height: `${Math.max(2, (day.playbacks / maximum) * 100)}%` }} />
            </span>
            <span aria-hidden="true" className="admin-chart-label">{day.label}</span>
            <span className="admin-chart-tooltip" id={tooltipId} role="tooltip">
              <strong>{dateLabel}</strong>
              <span><i className="is-views" />Song views <b>{day.views}</b></span>
              <span><i className="is-playbacks" />Playback starts <b>{day.playbacks}</b></span>
            </span>
          </button>
        </div>
      })}
    </div>
    <p className="admin-sr-only">Tab through each date to hear its song view and playback start counts.</p>
  </div>
}
