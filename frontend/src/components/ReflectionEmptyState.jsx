export default function ReflectionEmptyState({ filtered, onAdd }) {
  return (
    <section className="rw-empty">
      <span aria-hidden="true">★</span>
      <h2>{filtered ? 'No memories match these filters.' : 'No memories have been shared yet.'}</h2>
      <p>{filtered ? 'Try another song or search phrase.' : "Be the first to pin a memory inspired by Singapore's songs."}</p>
      {!filtered && <button className="rw-primary-button" onClick={onAdd} type="button">+ Add Reflection</button>}
    </section>
  )
}
