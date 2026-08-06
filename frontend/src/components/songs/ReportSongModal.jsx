import { useEffect, useRef, useState } from 'react'

const REASONS = [
  { label: 'Inappropriate content', value: 'INAPPROPRIATE' },
  { label: 'Copyright / IP violation', value: 'COPYRIGHT' },
  { label: 'Spam', value: 'SPAM' },
  { label: 'Broken or incorrect metadata', value: 'METADATA' },
  { label: 'Other', value: 'OTHER' },
]

export default function ReportSongModal({ busy, error, onCancel, onSubmit, song }) {
  const [reason, setReason] = useState(REASONS[0].value)
  const [details, setDetails] = useState('')
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

  function handleSubmit(event) {
    event.preventDefault()
    if (busy) return
    onSubmit({ details: details.trim() || null, reason })
  }

  return (
    <div className="report-dialog-backdrop" onMouseDown={onCancel} role="presentation">
      <section
        aria-labelledby="report-song-title"
        aria-modal="true"
        className="report-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 id="report-song-title">Report &ldquo;{song.title}&rdquo;</h2>
        <p>Let us know what&rsquo;s wrong. Our team will review this song.</p>

        <form onSubmit={handleSubmit}>
          <label className="report-dialog__field" htmlFor="report-song-reason">
            Reason
            <select disabled={busy} id="report-song-reason" onChange={(event) => setReason(event.target.value)} value={reason}>
              {REASONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="report-dialog__field" htmlFor="report-song-details">
            Additional details (optional)
            <textarea
              disabled={busy}
              id="report-song-details"
              maxLength={1000}
              onChange={(event) => setDetails(event.target.value)}
              rows={3}
              value={details}
            />
          </label>

          {error ? <p className="report-dialog__error" role="alert">{error}</p> : null}

          <div className="report-dialog__actions">
            <button disabled={busy} onClick={onCancel} ref={cancelRef} type="button">Cancel</button>
            <button className="report-dialog__submit" disabled={busy} type="submit">
              {busy ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
