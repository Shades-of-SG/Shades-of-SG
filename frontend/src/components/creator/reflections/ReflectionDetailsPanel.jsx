import ModeratorNoteField from './ModeratorNoteField'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function ReflectionDetailsPanel({ busy, isOpen, onAction, onClose, onSaveNote, reflection }) {
  if (!reflection) {
    return <aside className="crm-details crm-details--empty"><span aria-hidden="true">♡</span><p>Select a reflection to inspect its full details.</p></aside>
  }

  return (
    <>
      {isOpen ? <button aria-label="Close reflection details" className="crm-details-backdrop" onClick={onClose} type="button" /> : null}
      <aside aria-label="Reflection details" className={`crm-details${isOpen ? ' is-open' : ''}`}>
        <header>
          <div><span>Reflection details</span><h2>{reflection.song?.title || 'Unknown song'}</h2></div>
          <button aria-label="Close details" onClick={onClose} type="button">×</button>
        </header>
        <div className="crm-details__scroll">
          <div className="crm-details__badges">
            <span className={`crm-status is-${reflection.status.toLowerCase()}`}>{reflection.status}</span>
            <span>{reflection.guestSubmission ? 'Guest submission' : 'Registered account'}</span>
            {reflection.isAnonymous ? <span>Anonymous publicly</span> : null}
          </div>
          <dl className="crm-details__meta">
            <div><dt>Author</dt><dd>{reflection.displayName || 'Anonymous'}</dd></div>
            {reflection.accountName && reflection.isAnonymous ? <div><dt>Account</dt><dd>{reflection.accountName}</dd></div> : null}
            <div><dt>Submitted</dt><dd>{formatDate(reflection.createdAt)}</dd></div>
            {reflection.moderatedAt ? <div><dt>Last moderated</dt><dd>{formatDate(reflection.moderatedAt)}{reflection.moderator?.name ? ` by ${reflection.moderator.name}` : ''}</dd></div> : null}
          </dl>
          <section className="crm-details__memory"><h3>Full reflection</h3><p>{reflection.content}</p></section>
          <section className="crm-details__tags"><h3>Memory tags</h3>{reflection.tags?.length ? <div>{reflection.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : <p>No tags added.</p>}</section>
          <ModeratorNoteField disabled={busy} initialValue={reflection.moderatorNote || ''} key={reflection.id} onSave={(note) => onSaveNote(reflection, note)} />
        </div>
        <footer className="crm-details__actions">
          {reflection.status !== 'APPROVED' ? <button className="is-approve" disabled={busy} onClick={() => onAction(reflection, 'approve')} type="button">Approve</button> : null}
          <button className="is-flag" disabled={busy} onClick={() => onAction(reflection, 'flag')} type="button">{reflection.status === 'FLAGGED' ? 'Keep Flagged' : 'Flag / Request Review'}</button>
          {reflection.status !== 'REJECTED' ? <button className="is-delete" disabled={busy} onClick={() => onAction(reflection, 'reject')} type="button">Reject</button> : null}
          <button className="is-delete" disabled={busy} onClick={() => onAction(reflection, 'delete')} type="button">Delete</button>
        </footer>
      </aside>
    </>
  )
}
