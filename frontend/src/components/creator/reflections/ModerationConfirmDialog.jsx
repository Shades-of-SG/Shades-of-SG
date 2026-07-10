import { useEffect, useRef } from 'react'

export default function ModerationConfirmDialog({ busy, onCancel, onConfirm, reflection }) {
  const cancelRef = useRef(null)
  const previousFocusRef = useRef(document.activeElement)

  useEffect(() => {
    const previousFocus = previousFocusRef.current
    cancelRef.current?.focus()
    const close = (event) => { if (event.key === 'Escape' && !busy) onCancel() }
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('keydown', close)
      previousFocus?.focus?.()
    }
  }, [busy, onCancel])

  return (
    <div className="crm-dialog-backdrop" role="presentation">
      <section aria-labelledby="crm-delete-title" aria-modal="true" className="crm-dialog" role="dialog">
        <span aria-hidden="true" className="crm-dialog__icon">!</span>
        <h2 id="crm-delete-title">Delete this reflection?</h2>
        <p>This permanently removes the memory by <strong>{reflection.displayName || 'Anonymous'}</strong>. This action cannot be undone.</p>
        <div><button disabled={busy} onClick={onCancel} ref={cancelRef} type="button">Cancel</button><button className="is-delete" disabled={busy} onClick={onConfirm} type="button">{busy ? 'Deleting…' : 'Delete permanently'}</button></div>
      </section>
    </div>
  )
}
