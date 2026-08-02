const COPY = {
  APPROVED: ['No approved memories yet', 'Approved reflections will appear here.'],
  FLAGGED: ['No flagged reflections', 'Nothing currently needs further attention.'],
  PENDING: ['All caught up', 'There are no reflections waiting for review.'],
  REJECTED: ['No rejected reflections', 'Rejected community submissions will appear here.'],
}

export default function ModerationEmptyState({ filtered, onClear, status }) {
  const [title, description] = filtered ? ['No filtered results', 'No reflections match these filters.'] : COPY[status]
  return (
    <div className="crm-empty-state">
      <span aria-hidden="true">♡</span><h2>{title}</h2><p>{description}</p>
      {filtered ? <button onClick={onClear} type="button">Clear filters</button> : null}
    </div>
  )
}
