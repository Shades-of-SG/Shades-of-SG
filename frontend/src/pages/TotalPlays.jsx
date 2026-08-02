import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

export default function TotalPlays() {
  return (
    <div className="page-stack">
      <PageHeader description="Play analytics will appear after a persisted play-event source is implemented." eyebrow="Analytics" title="Total Plays" />
      <EmptyState description="Rhythm scores are persisted for registered users, but they are not a complete measure of Song plays. No analytics values are estimated or fabricated." title="Play analytics unavailable" />
    </div>
  )
}
