const COLOURS = ['mustard', 'rose', 'teal', 'blue', 'sage', 'lavender']

function colourFor(id = '') {
  return COLOURS[[...id].reduce((total, character) => total + character.charCodeAt(0), 0) % COLOURS.length]
}

function relativeTime(value) {
  const difference = new Date(value).getTime() - Date.now()
  const minutes = Math.round(difference / 60000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return formatter.format(Math.round(hours / 24), 'day')
}

function actionButtons(reflection, onAction, busy) {
  const approve = <button className="is-approve" disabled={busy} onClick={() => onAction(reflection, 'approve')} type="button">Approve</button>
  const flag = <button className="is-flag" disabled={busy} onClick={() => onAction(reflection, 'flag')} type="button">{reflection.status === 'FLAGGED' ? 'Keep flagged' : reflection.status === 'APPROVED' ? 'Flag / Unpublish' : 'Flag'}</button>
  const reject = <button className="is-delete" disabled={busy} onClick={() => onAction(reflection, 'reject')} type="button">Reject</button>
  return (
    <>
      {reflection.status !== 'APPROVED' ? approve : null}
      {flag}
      {reflection.status !== 'REJECTED' ? reject : null}
      <button aria-label={`Delete reflection by ${reflection.displayName}`} className="is-delete" disabled={busy} onClick={() => onAction(reflection, 'delete')} type="button">Delete</button>
    </>
  )
}

export default function ModerationCard({ busy, isSelected, onAction, onSelect, reflection }) {
  return (
    <article className={`crm-note is-${colourFor(reflection.id)}${isSelected ? ' is-selected' : ''}`}>
      <span aria-hidden="true" className="crm-note__pin" />
      <button aria-label={`View full reflection by ${reflection.displayName}`} className="crm-note__select" onClick={() => onSelect(reflection.id)} type="button">
        <span className="crm-note__topline">
          <span className="crm-note__song">♪ {reflection.song?.title || 'Unknown song'}</span>
          <span className={`crm-status is-${reflection.status.toLowerCase()}`}>{reflection.status}</span>
        </span>
        <span className="crm-note__preview">{reflection.content}</span>
        {reflection.tags?.length ? <span className="crm-note__tags">{reflection.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</span> : null}
        <span className="crm-note__meta"><strong>{reflection.displayName || 'Anonymous'}</strong><time dateTime={reflection.createdAt}>{relativeTime(reflection.createdAt)}</time></span>
      </button>
      <div className="crm-note__actions">{actionButtons(reflection, onAction, busy)}</div>
    </article>
  )
}
