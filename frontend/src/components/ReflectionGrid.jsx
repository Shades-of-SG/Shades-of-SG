import ReflectionCard from './ReflectionCard'

export default function ReflectionGrid({ reflections, onEdit, onDelete, onOpen }) {
  return (
    <section className="rw-grid reflection-grid" aria-label="Community memory board">
      {reflections.map((reflection) => (
        <ReflectionCard key={reflection.id} onDelete={onDelete} onEdit={onEdit} onOpen={onOpen} reflection={reflection} />
      ))}
    </section>
  )
}
