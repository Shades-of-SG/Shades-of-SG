export function scoreGrade(accuracy) {
  if (accuracy === null || accuracy === undefined || accuracy === '') return null
  if (!Number.isFinite(Number(accuracy))) return null
  const value = Number(accuracy)
  if (value >= 95) return 'S'
  if (value >= 90) return 'A'
  if (value >= 80) return 'B'
  if (value >= 70) return 'C'
  return 'D'
}

export function formatProfileDate(value, fallback = '') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}
