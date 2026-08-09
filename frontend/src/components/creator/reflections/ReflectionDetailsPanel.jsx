import ModeratorNoteField from './ModeratorNoteField'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value))
}

export default function ReflectionDetailsPanel({ busy, discussion, isOpen, onAction, onClose, onModerateComment, onSaveNote, reflection }) {
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
          <section className="crm-details__discussion">
            <h3>Discussion moderation</h3>
            {discussion?.loading ? <p role="status">Loading commentsâ€¦</p> : null}
            {discussion?.error ? <p className="crm-details__discussion-error" role="alert">{discussion.error}</p> : null}
            {!discussion?.loading && !discussion?.error && !discussion?.comments?.length ? <p>No comments are attached to this reflection.</p> : null}
            {discussion?.comments?.length ? <ol>
              {discussion.comments.map((comment) => <li key={comment.id}>
                <header><strong>{comment.author?.name || 'Unknown member'}</strong><span className={`crm-status is-${comment.status.toLowerCase()}`}>{comment.status}</span></header>
                <p>{comment.content}</p>
                <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
                {comment.reports?.length ? <div className="crm-comment-reports"><strong>Reports</strong>{comment.reports.map((report) => <div key={report.id}><p>{report.reason}</p><small>{report.reporter?.name || 'Member'} Â· {report.status} Â· {formatDate(report.createdAt)}</small>{report.status === 'PENDING' ? <button disabled={busy} onClick={() => onModerateComment(comment, 'KEEP_COMMENT', report.id)} type="button">Keep comment / dismiss report</button> : null}</div>)}</div> : null}
                {comment.moderationHistory?.length ? <details><summary>Moderation history ({comment.moderationHistory.length})</summary><ol>{comment.moderationHistory.map((action, index) => <li key={`${action.actionType}-${action.createdAt}-${index}`}><strong>{action.actionType.replaceAll('_', ' ')}</strong><p>{action.reason}</p><time dateTime={action.createdAt}>{formatDate(action.createdAt)}{action.actor?.name ? ` by ${action.actor.name}` : ''}</time></li>)}</ol></details> : null}
                <div className="crm-comment-actions"><button disabled={busy || comment.status === 'REMOVED'} onClick={() => onModerateComment(comment, 'WARN_USER')} type="button">Warn user</button><button className="is-delete" disabled={busy || comment.status === 'REMOVED'} onClick={() => onModerateComment(comment, 'REMOVE_COMMENT', comment.reports?.find((report) => report.status === 'PENDING')?.id || null)} type="button">Remove comment</button></div>
              </li>)}
            </ol> : null}
          </section>
          <section className="crm-details__tags"><h3>Memory tags</h3>{reflection.tags?.length ? <div>{reflection.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : <p>No tags added.</p>}</section>
          <ModeratorNoteField disabled={busy} initialValue={reflection.moderatorNote || ''} key={reflection.id} onSave={(note) => onSaveNote(reflection, note)} />
        </div>
        <footer className="crm-details__actions">
          {reflection.status !== 'APPROVED' ? <button className="is-approve" disabled={busy} onClick={() => onAction(reflection, 'approve')} type="button">Approve</button> : null}
          <button className="is-flag" disabled={busy} onClick={() => onAction(reflection, 'flag')} type="button">{reflection.status === 'FLAGGED' ? 'Keep Flagged' : 'Flag / Request Review'}</button>
          {reflection.status !== 'REJECTED' ? <button className="is-delete" disabled={busy} onClick={() => onAction(reflection, 'reject')} type="button">Reject</button> : null}
          {!reflection.guestSubmission ? <button disabled={busy} onClick={() => onAction(reflection, 'warn')} type="button">Warn account</button> : null}
          <button className="is-delete" disabled={busy} onClick={() => onAction(reflection, 'delete')} type="button">Delete</button>
        </footer>
      </aside>
    </>
  )
}
