export const labelFor = (value = '') => String(value).replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

export function formatDate(value, includeTime = true) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString([], includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' })
}

export function relativeTime(value) {
  if (!value) return 'Unknown time'
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const ranges = [[60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.35, 'week'], [12, 'month']]
  let duration = seconds
  for (const [size, unit] of ranges) {
    if (Math.abs(duration) < size) return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(duration), unit)
    duration /= size
  }
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(duration), 'year')
}

export function useTab(searchParams, setSearchParams, allowed, fallback) {
  const requested = searchParams.get('tab')
  const active = allowed.includes(requested) ? requested : fallback
  const setActive = (tab) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next)
  }
  return [active, setActive]
}
