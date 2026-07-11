import { Heart, Music2, Star } from 'lucide-react'

export default function ProfileStats({ badges, loading, memories, scores }) {
  const items = [
    { icon: Heart, label: 'Memories shared', value: memories },
    { icon: Music2, label: 'Songs played', value: scores },
    { icon: Star, label: 'Achievements earned', value: badges },
  ]
  return <section aria-label="Personal statistics" className="profile-stats">{items.map(({ icon: Icon, label, value }) => <article key={label}>{loading ? <span className="profile-skeleton profile-skeleton--number" /> : <><Icon aria-hidden="true" /><strong>{value}</strong></>}<span>{label}</span></article>)}</section>
}
