import useReveal from '../../hooks/useReveal'
import VaultItem from './VaultItem'

export default function VaultFolder({ collection, isOpen, onToggle }) {
  const { isVisible, nodeRef } = useReveal()
  const panelId = `vault-panel-${collection.id}`

  return (
    <li
      className={`vault-folder reveal ${isVisible ? 'is-visible' : ''} ${isOpen ? 'is-open' : ''}`}
      ref={nodeRef}
    >
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="vault-folder__tab"
        onClick={() => onToggle(collection.id)}
        type="button"
      >
        <span className="vault-folder__icon" aria-hidden="true">📂</span>
        <span className="vault-folder__heading">
          <span className="vault-folder__number">Collection {collection.number}</span>
          <span className="vault-folder__title">{collection.title}</span>
        </span>
        <span className="vault-folder__chevron" aria-hidden="true">{isOpen ? '−' : '+'}</span>
      </button>

      <div className={`vault-folder__panel ${isOpen ? 'is-open' : ''}`} id={panelId}>
        <div className="vault-folder__body">
          <p className="vault-folder__question">{collection.question}</p>

          <div className="vault-grid">
            {collection.items.map((item) => (
              <VaultItem item={item} key={item.id} />
            ))}
          </div>

          <p className="vault-folder__reflection">{collection.reflection}</p>
        </div>
      </div>
    </li>
  )
}
