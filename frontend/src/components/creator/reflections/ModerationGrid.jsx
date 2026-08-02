import ModerationCard from './ModerationCard'

export default function ModerationGrid({ busyId, onAction, onSelect, reflections, selectedId }) {
  return (
    <div className="crm-grid">
      {reflections.map((reflection) => (
        <ModerationCard
          busy={busyId === reflection.id}
          isSelected={selectedId === reflection.id}
          key={reflection.id}
          onAction={onAction}
          onSelect={onSelect}
          reflection={reflection}
        />
      ))}
    </div>
  )
}
