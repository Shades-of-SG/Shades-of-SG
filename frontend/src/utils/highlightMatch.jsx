function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlightMatch(text, term) {
  const value = text ?? ''
  const trimmedTerm = term?.trim()
  if (!trimmedTerm) return value

  const pattern = new RegExp(`(${escapeRegExp(trimmedTerm)})`, 'ig')
  const parts = String(value).split(pattern)
  if (parts.length === 1) return value

  return parts.map((part, index) => (
    index % 2 === 1
      ? <mark className="song-search-highlight" key={index}>{part}</mark>
      : part
  ))
}
