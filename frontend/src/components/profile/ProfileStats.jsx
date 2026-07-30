import { Gamepad2, Medal, Star, Trophy } from 'lucide-react'

export default function ProfileStats({ badges, loading, rhythm }) {
  const items = [
    badges === null ? null : { icon: Star, isLoading: loading.badges, label: 'Achievements earned', value: badges },
    rhythm === null ? null : { icon: Trophy, isLoading: loading.scores, label: 'Best rhythm score', value: Number(rhythm?.bestScore || 0).toLocaleString() },
    rhythm === null ? null : { icon: Medal, isLoading: loading.scores, label: 'Rhythm ranking', value: rhythm?.rank ? `#${rhythm.rank}` : '—' },
    rhythm === null ? null : { icon: Gamepad2, isLoading: loading.scores, label: 'Games played', value: rhythm?.gamesPlayed || 0 },
  ].filter(Boolean)
  return <section aria-label="Personal statistics" className="profile-stats">{items.map(({ icon: Icon, isLoading, label, value }) => <article key={label}><Icon aria-hidden="true" />{isLoading ? <span aria-label={`Loading ${label}`} className="profile-skeleton profile-skeleton--number" /> : <strong>{value}</strong>}<span>{label}</span></article>)}</section>
}
