import ProfileEmptyState from './ProfileEmptyState'
import ProfileSectionHeader from './ProfileSectionHeader'
import { formatProfileDate, scoreGrade } from './profileUtils'

export default function ProfileMusicJourney({ error, loading, onRetry, scores }) {
  return <section className="profile-section"><ProfileSectionHeader subtitle="Recent rhythm game scores" title="My Music Journey" />
    {loading ? <div className="profile-score-list">{[1, 2, 3].map((value) => <span className="profile-skeleton profile-skeleton--score" key={value} />)}</div> : null}
    {error ? <div className="profile-error" role="alert"><p>{error}</p><button onClick={onRetry} type="button">Retry</button></div> : null}
    {!loading && !error && !scores.length ? <ProfileEmptyState actionLabel="Play rhythm game" description="Choose a published song and complete a rhythm session to begin your journey." title="No rhythm scores yet" to="/rhythm-game" variant="music" /> : null}
    {!loading && !error && scores.length ? <div className="profile-score-list">{scores.slice(0, 5).map((entry) => <article className="profile-score" key={entry.id}>
      {entry.song?.coverImageUrl ? <img alt={`${entry.song.title} cover`} src={entry.song.coverImageUrl} /> : <span className="profile-score__fallback" aria-hidden="true">♫</span>}
      <div><strong>{entry.song?.title || 'Song unavailable'}</strong><small>{entry.difficulty} · {formatProfileDate(entry.createdAt)}</small></div>
      <span><small>Score</small><strong>{Number(entry.score).toLocaleString()}</strong></span>
      <span><small>Accuracy</small><strong>{Number(entry.accuracy).toFixed(1)}%</strong></span>
      <b className={`profile-grade profile-grade--${scoreGrade(entry.accuracy)}`}>{scoreGrade(entry.accuracy) || '—'}</b>
      <i aria-label={`${entry.accuracy}% accuracy`} className="profile-score__progress" style={{ '--score-progress': `${Math.max(0, Math.min(100, Number(entry.accuracy) || 0))}%` }} />
    </article>)}</div> : null}
  </section>
}
