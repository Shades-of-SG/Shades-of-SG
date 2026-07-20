import { Heart, Music2, Star } from 'lucide-react'

export default function ProfileStats({ badges, loading, memories, scores }) {
  const items = [
    { icon: Heart, isLoading: loading.memories, label: 'Memories shared', value: memories },
    { icon: Music2, isLoading: loading.scores, label: 'Songs played', value: scores },
    { icon: Star, isLoading: loading.badges, label: 'Achievements earned', value: badges },
  ]

  return (
    <section aria-label="Personal statistics" className="profile-stats">
      {items.map(({ icon: Icon, isLoading, label, value }) => (
        <article key={label}>
          <Icon aria-hidden="true" />
          {isLoading ? <span aria-label={`Loading ${label}`} className="profile-skeleton profile-skeleton--number" /> : <strong>{value}</strong>}
          <span>{label}</span>
        </article>
      ))}
    </section>
  )
}
