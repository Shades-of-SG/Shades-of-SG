import { Gamepad2, Medal, Star, Trophy } from 'lucide-react'

function difficultyLabel(value) {
  return value ? value[0] + value.slice(1).toLowerCase() : ''
}

function accuracyLabel(value) {
  const accuracy = Number(value)
  return Number.isFinite(accuracy) ? `${accuracy.toFixed(2)}%` : 'Accuracy unavailable'
}

export default function ProfileStats({ badges, loading, rhythm }) {
  const bestRank = rhythm?.bestLeaderboardRank || null
  const items = [
    badges === null ? null : { icon: Star, isLoading: loading.badges, label: 'Achievements earned', value: badges },
    rhythm === null ? null : { icon: Trophy, isLoading: loading.scores, label: 'Best rhythm score', value: Number(rhythm?.bestScore || 0).toLocaleString() },
    rhythm === null ? null : {
      detail: bestRank ? `${bestRank.songTitle} · ${difficultyLabel(bestRank.difficulty)}` : 'No ranked rhythm-game scores yet',
      icon: Medal,
      isLoading: loading.scores,
      label: 'Best leaderboard rank',
      meta: bestRank ? `${Number(bestRank.score).toLocaleString()} points · ${accuracyLabel(bestRank.accuracy)}` : '',
      value: bestRank ? `#${bestRank.position}` : '—',
    },
    rhythm === null ? null : { icon: Gamepad2, isLoading: loading.scores, label: 'Games played', value: rhythm?.gamesCompleted ?? rhythm?.gamesPlayed ?? 0 },
  ].filter(Boolean)

  return <section aria-label="Personal statistics" className="profile-stats">{items.map(({ detail, icon: Icon, isLoading, label, meta, value }) => <article className={detail ? 'profile-stat--detailed' : ''} key={label}><Icon aria-hidden="true" /><div className="profile-stat__copy">{isLoading ? <span aria-label={`Loading ${label}`} className="profile-skeleton profile-skeleton--number" /> : <strong>{value}</strong>}<span>{label}</span>{!isLoading && detail ? <small>{detail}</small> : null}{!isLoading && meta ? <small>{meta}</small> : null}</div></article>)}</section>
}
