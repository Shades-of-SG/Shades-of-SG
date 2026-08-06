import { Inbox, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

function useOverlayFocus() {
  const overlayRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useEffect(() => {
    restoreFocusRef.current = document.activeElement
    const overlay = overlayRef.current
    const trapFocus = (event) => {
      if (event.key !== 'Tab') return
      const focusable = [...(overlay?.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || [])]
      if (!focusable.length) { event.preventDefault(); return }
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    overlay?.addEventListener('keydown', trapFocus)
    const frame = window.requestAnimationFrame(() => {
      const currentOverlay = overlayRef.current
      if (!currentOverlay || currentOverlay.contains(document.activeElement)) return
      currentOverlay.querySelector('[autofocus], input, select, textarea, button, a[href]')?.focus()
    })
    return () => {
      overlay?.removeEventListener('keydown', trapFocus)
      window.cancelAnimationFrame(frame)
      const previous = restoreFocusRef.current
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  return overlayRef
}

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
          aria-label={item.countLoading
            ? `${item.label}: count loading`
            : item.count !== undefined && item.count !== null
              ? `${item.label}: ${item.count}`
              : item.label}
          className={active === item.id ? 'is-active' : ''}
          key={item.id}
          onClick={() => onChange(item.id)}
          type="button"
        >
          {item.label}
          {item.countLoading
            ? <span aria-hidden="true" className="admin-tab-count is-loading" />
            : item.count !== undefined && item.count !== null
              ? <span className="admin-tab-count">{item.count}</span>
              : null}
        </button>
      ))}
    </nav>
  )
}

export function AdminTabPanel({ children }) {
  return <div className="admin-tab-panel">{children}</div>
}

export function AdminSummaryError({ message, onRetry }) {
  if (!message) return null
  return <div className="admin-summary-error" role="alert"><span>Tab counts could not be loaded.</span><button onClick={onRetry} type="button">Retry</button></div>
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
  return <div aria-busy="true" aria-label="Loading" className="admin-loading" role="status">{Array.from({ length: count }, (_, index) => <span aria-hidden="true" key={index} />)}</div>
}

export function Pagination({ onNext, onPrevious, page, totalPages }) {
  if (!totalPages || totalPages <= 1) return null
  return <nav aria-label="Pagination" className="admin-pagination"><button className="admin-button admin-button--ghost" disabled={page <= 1} onClick={onPrevious} type="button">Previous</button><span>Page {page} of {totalPages}</span><button className="admin-button admin-button--ghost" disabled={page >= totalPages} onClick={onNext} type="button">Next</button></nav>
}

export function Feedback({ message, type = 'status' }) {
  return message ? <div aria-atomic="true" aria-live={type === 'error' ? 'assertive' : 'polite'} className={`admin-feedback is-${type}`} key={message} role={type === 'error' ? 'alert' : 'status'}>{message}</div> : null
}

export function DetailDrawer({ children, onClose, open, title }) {
  if (!open) return null
  return <OpenDetailDrawer onClose={onClose} title={title}>{children}</OpenDetailDrawer>
}

function OpenDetailDrawer({ children, onClose, title }) {
  const drawerRef = useOverlayFocus()
  return (
    <>
      <button aria-label="Close detail panel" className="admin-drawer-backdrop" onClick={onClose} type="button" />
      <aside aria-label={title} className="admin-detail-drawer" ref={drawerRef}>
        <header><h2>{title}</h2><button aria-label="Close" onClick={onClose} type="button"><X /></button></header>
        <div>{children}</div>
      </aside>
    </>
  )
}

export function ConfirmationModal({ busy, children, confirmLabel, danger = false, onCancel, onConfirm, title }) {
  const modalRef = useOverlayFocus()
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <section aria-busy={busy || undefined} aria-describedby="admin-confirm-description" aria-labelledby="admin-confirm-title" aria-modal="true" className="admin-modal" ref={modalRef} role="dialog">
        <h2 id="admin-confirm-title">{title}</h2>
        <div id="admin-confirm-description">{children}</div>
        <footer>
          <button className="admin-button admin-button--ghost" disabled={busy} onClick={onCancel} type="button">Cancel</button>
          <button aria-busy={busy || undefined} className={`admin-button ${danger ? 'admin-button--danger' : 'admin-button--primary'}`} disabled={busy} onClick={() => { if (!busy) onConfirm() }} type="button">{busy ? 'Working…' : confirmLabel}</button>
        </footer>
      </section>
    </div>
  )
}

// Shared by the Creators/Safety & Reports pages and the Users tab so the
// suspend/restore copy and confirmation flow stay identical everywhere.
export function AccountModal({ busy, onCancel, onConfirm, onReason, reason, user }) {
  const restoring = user.accountStatus === 'SUSPENDED'
  return <ConfirmationModal busy={busy} confirmLabel={restoring ? 'Restore member account' : 'Suspend member account'} danger={!restoring} onCancel={onCancel} onConfirm={onConfirm} title={restoring ? 'Restore this member account?' : 'Suspend this member account?'}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>{restoring
    ? 'Login and authenticated member access resume on the existing account. Stored profiles, songs, scores, badges, applications, reflections and history are reused; creator access remains in its separately recorded state.'
    : 'Login and all authenticated member access stop immediately, including creator-only access. Stored profiles, songs, scores, badges, applications, reflections and history remain. Published songs stay public unless separately changed in Content.'}</p><label>Administrator reason (required)<textarea maxLength="1000" minLength="5" onChange={(event) => onReason(event.target.value)} placeholder={restoring ? 'Explain why access is safe to restore' : 'Explain the broader platform risk and include appeal guidance'} required value={reason} /></label></form></ConfirmationModal>
}

export function CreatorAccessModal({ busy, onCancel, onConfirm, onReason, reason, user }) {
  const restoring = user.creatorAccessStatus === 'SUSPENDED'
  return <ConfirmationModal busy={busy} confirmLabel={restoring ? 'Restore creator access' : 'Suspend creator access'} danger={!restoring} onCancel={onCancel} onConfirm={onConfirm} title={restoring ? 'Restore creator access?' : 'Suspend creator access?'}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>{restoring
    ? 'Creator tools become available again. The member account and all stored content are unchanged.'
    : 'Creator-only tools (Studio, dashboard, analytics) stop immediately. The member account stays active — this person can still sign in and use the site as a regular member. Published songs stay public unless separately changed in Content.'}</p><label>Administrator reason (required)<textarea maxLength="1000" minLength="5" onChange={(event) => onReason(event.target.value)} placeholder={restoring ? 'Explain why creator access is safe to restore' : 'Explain the creator-specific concern and include appeal guidance'} required value={reason} /></label></form></ConfirmationModal>
}

export function Panel({ actions, children, className = '', subtitle, title }) {
  return (
    <section className={`admin-panel ${className}`.trim()}>
      {(title || actions) ? <header><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{actions}</header> : null}
      {children}
    </section>
  )
}
