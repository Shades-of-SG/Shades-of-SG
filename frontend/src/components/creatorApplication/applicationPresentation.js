const STATUS_LABELS = {
  APPROVED: 'Approved', CHANGES_REQUESTED: 'Additional information requested', DRAFT: 'Draft',
  INTERVIEW: 'Interview', REJECTED: 'Not approved', SHORTLISTED: 'Shortlisted',
  SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under review', WITHDRAWN: 'Withdrawn',
}

function formatDate(value) {
  if (!value) return 'Not yet submitted'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export { formatDate, STATUS_LABELS }
