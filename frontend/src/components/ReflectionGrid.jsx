import ReflectionCard from './ReflectionCard'

export default function ReflectionGrid({ likeBusyIds, reflections, onEdit, onDelete, onLike, onOpen }) {
  return (
    <section className="rw-grid reflection-grid" aria-label="Community memory board">
      {reflections.map((reflection) => (
        <ReflectionCard key={reflection.id} likeBusy={likeBusyIds.has(reflection.id)} onDelete={onDelete} onEdit={onEdit} onLike={onLike} onOpen={onOpen} reflection={reflection} />
      ))}
    </section>
  )
}
