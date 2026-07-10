import ReflectionCard from './ReflectionCard'

export default function ReflectionGrid({ reflections, onEdit, onDelete }) {
  return (
    <section className="rw-grid" aria-label="Community memory board">
      {reflections.map((reflection) => (
        <ReflectionCard key={reflection.id} onDelete={onDelete} onEdit={onEdit} reflection={reflection} />
      ))}
    </section>
  )
}
