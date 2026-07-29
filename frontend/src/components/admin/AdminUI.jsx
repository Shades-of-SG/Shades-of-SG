import { Inbox, X } from 'lucide-react'

export function AdminPageHeader({ actions, description, eyebrow, title }) {
  return (
    <header className="admin-page-header">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <span>{description}</span> : null}
      </div>
      {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
    </header>
  )
}

export function AdminTabs({ active, items, onChange }) {
  return (
    <nav aria-label="Page sections" className="admin-tabs">
      {items.map((item) => (
        <button
          aria-current={active === item.id ? 'page' : undefined}
          className={active === item.id ? 'is-active' : ''}
          key={item.id}
          onClick={() => onChange(item.id)}
          type="button"
        >
          {item.label}
          {item.count !== undefined ? <span>{item.count}</span> : null}
        </button>
      ))}
    </nav>
  )
}

export function StatusBadge({ children, status = '' }) {
  const tone = String(status).toLowerCase().replaceAll('_', '-')
  return <span className={`admin-status is-${tone}`}>{children || String(status).replaceAll('_', ' ')}</span>
}

export function FilterBar({ children, onClear, showClear = false }) {
  return <div className="admin-filter-bar">{children}{showClear ? <button className="admin-filter-clear" onClick={onClear} type="button">Clear filters</button> : null}</div>
}

export function DataTable({ caption, children, columns }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <caption className="admin-sr-only">{caption}</caption>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        {Array.isArray(children) && children.some((child) => child?.type === 'tbody') ? children : <tbody>{children}</tbody>}
      </table>
    </div>
  )
}

export function EmptyState({ action, description, icon: Icon = Inbox, title = 'Nothing here yet' }) {
  return (
    <div className="admin-empty-state">
      <span aria-hidden="true"><Icon /></span>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  )
}

export function LoadingRows({ count = 5 }) {
  return <div aria-label="Loading" className="admin-loading" role="status">{Array.from({ length: count }, (_, index) => <span key={index} />)}</div>
}

export function Pagination({ onNext, onPrevious, page, totalPages }) {
  if (!totalPages || totalPages <= 1) return null
  return <nav aria-label="Pagination" className="admin-pagination"><button className="admin-button admin-button--ghost" disabled={page <= 1} onClick={onPrevious} type="button">Previous</button><span>Page {page} of {totalPages}</span><button className="admin-button admin-button--ghost" disabled={page >= totalPages} onClick={onNext} type="button">Next</button></nav>
}

export function Feedback({ message, type = 'status' }) {
  return message ? <div className={`admin-feedback is-${type}`} role={type === 'error' ? 'alert' : 'status'}>{message}</div> : null
}

export function DetailDrawer({ children, onClose, open, title }) {
  if (!open) return null
  return (
    <>
      <button aria-label="Close detail panel" className="admin-drawer-backdrop" onClick={onClose} type="button" />
      <aside aria-label={title} className="admin-detail-drawer">
        <header><h2>{title}</h2><button aria-label="Close" onClick={onClose} type="button"><X /></button></header>
        <div>{children}</div>
      </aside>
    </>
  )
}

export function ConfirmationModal({ busy, children, confirmLabel, danger = false, onCancel, onConfirm, title }) {
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <section aria-labelledby="admin-confirm-title" aria-modal="true" className="admin-modal" role="dialog">
        <h2 id="admin-confirm-title">{title}</h2>
        <div>{children}</div>
        <footer>
          <button className="admin-button admin-button--ghost" disabled={busy} onClick={onCancel} type="button">Cancel</button>
          <button className={`admin-button ${danger ? 'admin-button--danger' : 'admin-button--primary'}`} disabled={busy} onClick={onConfirm} type="button">{busy ? 'Working…' : confirmLabel}</button>
        </footer>
      </section>
    </div>
  )
}

export function Panel({ actions, children, subtitle, title }) {
  return (
    <section className="admin-panel">
      {(title || actions) ? <header><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{actions}</header> : null}
      {children}
    </section>
  )
}
