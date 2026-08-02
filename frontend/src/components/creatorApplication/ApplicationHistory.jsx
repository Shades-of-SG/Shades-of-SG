import { ArrowRight, CalendarDays, ChevronRight, Clock3, Download, FileText, MessageSquareText, Pencil, Trash2 } from 'lucide-react'
import { formatDate, STATUS_LABELS } from './applicationPresentation'

export default function ApplicationHistory({ applications, busy, onContinue, onDownload, onWithdraw }) {
  return <section className="creator-history" id="application-history" aria-labelledby="application-history-title">
    <header><div><p className="creator-application-eyebrow">Your applications</p><h2 id="application-history-title">Application history</h2><p>Follow your application from draft through the review process.</p></div></header>
    {applications.length ? <div className="creator-history__list">{applications.map((application) => {
      const editable = ['DRAFT', 'CHANGES_REQUESTED'].includes(application.status)
      const withdrawable = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'].includes(application.status)
      return <article className="creator-history-card" key={application.id}>
        <div className="creator-history-card__top">
          <span className={`creator-status creator-status--${application.status.toLowerCase()}`}>{STATUS_LABELS[application.status] || application.status}</span>
          <small>Ref {application.id.slice(0, 8).toUpperCase()}</small>
        </div>
        <div className="creator-history-card__dates">
          <span><CalendarDays />{application.submittedAt ? `Submitted ${formatDate(application.submittedAt)}` : `Started ${formatDate(application.createdAt)}`}</span>
          <span><Clock3 />Updated {formatDate(application.updatedAt)}</span>
        </div>
        {application.applicantFeedback ? <div className="creator-history-card__feedback"><MessageSquareText /><p><strong>Message from our review team</strong>{application.applicantFeedback}</p></div> : null}
        <details>
          <summary>View details and review timeline <ChevronRight /></summary>
          <div className="creator-history-card__detail">
            <dl><div><dt>Current review stage</dt><dd>{STATUS_LABELS[application.status] || application.status}</dd></div><div><dt>Portfolio</dt><dd>{application.portfolioUrl ? <a href={application.portfolioUrl} rel="noreferrer" target="_blank">Open portfolio</a> : 'Not added'}</dd></div><div><dt>Resume</dt><dd>{application.hasResume ? application.resumeFileName : 'Not uploaded'}</dd></div></dl>
            {(application.history || []).length ? <ol className="creator-history-timeline">{application.history.map((entry) => <li key={entry.id}><span /><div><strong>{STATUS_LABELS[entry.toStatus] || entry.toStatus}</strong><time>{formatDate(entry.createdAt)}</time>{entry.note ? <p>{entry.note}</p> : null}</div></li>)}</ol> : null}
          </div>
        </details>
        <div className="creator-history-card__actions">
          {editable ? <button disabled={busy} onClick={() => onContinue(application)} type="button"><Pencil />Continue application</button> : null}
          {application.hasResume ? <button disabled={busy} onClick={() => onDownload(application)} type="button"><Download />Download resume</button> : null}
          {withdrawable ? <button className="is-danger" disabled={busy} onClick={() => onWithdraw(application)} type="button"><Trash2 />Withdraw</button> : null}
        </div>
      </article>
    })}</div> : <div className="creator-history__empty"><span><FileText /></span><h3>You have not started an application yet</h3><p>Complete the steps above when you are ready. You can save a private draft and return at any time.</p><button onClick={() => onContinue(null)} type="button">Start your application <ArrowRight /></button></div>}
  </section>
}
