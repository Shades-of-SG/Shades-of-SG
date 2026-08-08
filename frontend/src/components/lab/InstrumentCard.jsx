export default function InstrumentCard({ instrument, onPreloadFull, onPreview, onSelect }) {
  return (
    <article className="lab-card" onMouseEnter={() => onPreloadFull?.(instrument)}>
      <div className="lab-card__art" aria-hidden="true">
        <span>{instrument.icon}</span>
      </div>

      <div className="lab-card__body">
        <p className="lab-card__origin">{instrument.origin}</p>
        <h3>{instrument.name}</h3>
        <p className="lab-card__description">{instrument.description}</p>
      </div>

      <div className="lab-card__actions">
        <button
          aria-label={`Preview ${instrument.name} sound`}
          className="lab-card__preview"
          onClick={(event) => {
            event.stopPropagation()
            onPreview?.(instrument)
          }}
          onFocus={() => onPreloadFull?.(instrument)}
          type="button"
        >
          🔊 Preview
        </button>
        <button className="lab-card__cta" onClick={() => onSelect(instrument.id)} type="button">
          Play Instrument
        </button>
      </div>
    </article>
  )
}
