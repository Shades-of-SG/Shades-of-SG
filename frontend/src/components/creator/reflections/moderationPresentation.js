const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const fullDateFormatter = new Intl.DateTimeFormat('en-SG', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const noteVariants = ['mustard', 'rose', 'teal', 'blue', 'sage', 'lavender']

export function normalizeStatus(value) {
  const status = typeof value === 'string' ? value : value?.status || value?.moderationStatus
  return String(status || 'PENDING').toUpperCase()
}

export function reflectionAuthor(reflection) {
  if (isAnonymousReflection(reflection)) return 'Anonymous'

  return (
    reflection?.displayName ||
    reflection?.author?.name ||
    reflection?.user?.name ||
    reflection?.authorName ||
    'Unknown contributor'
  )
}

export function reflectionSongTitle(reflection) {
  return reflection?.song?.title || reflection?.songTitle || 'Untitled song'
}

export function isAnonymousReflection(reflection) {
  return Boolean(
    reflection?.isAnonymous ||
      reflection?.displayMode === 'ANONYMOUS' ||
      (!reflection?.displayName && reflection?.guestSubmission)
  )
}

export function reflectionTags(reflection) {
  const tags = reflection?.tags

  if (Array.isArray(tags)) {
    return tags
      .map((tag) => (typeof tag === 'string' ? tag : tag?.name || tag?.label))
      .filter(Boolean)
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  return []
}

export function formatRelativeTime(value) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Date unavailable'

  const differenceInSeconds = Math.round((timestamp - Date.now()) / 1000)
  const absoluteSeconds = Math.abs(differenceInSeconds)

  if (absoluteSeconds < 45) return 'just now'
  if (absoluteSeconds < 60 * 60) {
    return relativeTimeFormatter.format(Math.round(differenceInSeconds / 60), 'minute')
  }
  if (absoluteSeconds < 60 * 60 * 24) {
    return relativeTimeFormatter.format(Math.round(differenceInSeconds / (60 * 60)), 'hour')
  }
  if (absoluteSeconds < 60 * 60 * 24 * 30) {
    return relativeTimeFormatter.format(Math.round(differenceInSeconds / (60 * 60 * 24)), 'day')
  }
  if (absoluteSeconds < 60 * 60 * 24 * 365) {
    return relativeTimeFormatter.format(
      Math.round(differenceInSeconds / (60 * 60 * 24 * 30)),
      'month'
    )
  }

  return relativeTimeFormatter.format(
    Math.round(differenceInSeconds / (60 * 60 * 24 * 365)),
    'year'
  )
}

export function formatFullDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : fullDateFormatter.format(date)
}

export function noteVariant(reflection) {
  const source = String(reflection?.id || reflection?.content || 'reflection')
  const hash = [...source].reduce((total, character) => total + character.charCodeAt(0), 0)

  return {
    decoration: hash % 3 === 0 ? 'tape' : 'pin',
    tone: noteVariants[hash % noteVariants.length],
  }
}

export function actionsForStatus(value) {
  switch (normalizeStatus(value)) {
    case 'PENDING':
      return [
        { action: 'approve', label: 'Approve', tone: 'primary' },
        { action: 'flag', label: 'Flag / Review', tone: 'secondary' },
        { action: 'delete', label: 'Delete', tone: 'danger' },
      ]
    case 'APPROVED':
      return [
        { action: 'flag', label: 'Flag / Unpublish', tone: 'secondary' },
        { action: 'delete', label: 'Delete', tone: 'danger' },
      ]
    case 'FLAGGED':
      return [
        { action: 'approve', label: 'Approve', tone: 'primary' },
        { action: 'flag', label: 'Keep Flagged', tone: 'secondary' },
        { action: 'delete', label: 'Delete', tone: 'danger' },
      ]
    default:
      return [
        { action: 'approve', label: 'Approve', tone: 'primary' },
        { action: 'delete', label: 'Delete', tone: 'danger' },
      ]
  }
}
