export default function InstrumentCard({ instrument, onSelect }) {
  return (
    <article className="lab-card">
      <div className="lab-card__art" aria-hidden="true">
        <span>{instrument.icon}</span>
      </div>

      <div className="lab-card__body">
        <p className="lab-card__origin">{instrument.origin}</p>
        <h3>{instrument.name}</h3>
        <p className="lab-card__description">{instrument.description}</p>
      </div>

      <button className="lab-card__cta" onClick={() => onSelect(instrument.id)} type="button">
        Play Instrument
      </button>
    </article>
  )
}
