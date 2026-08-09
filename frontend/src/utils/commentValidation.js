export const MAX_COMMENT_LENGTH = 500

export function normalizeCommentContent(value) {
  return typeof value === 'string' ? value.normalize('NFKC').replace(/\s+/g, ' ').trim() : ''
}

export function validateCommentContent(value) {
  const content = normalizeCommentContent(value)
  if (!content) return { error: 'Write a comment before posting.' }
  if ([...content].length > MAX_COMMENT_LENGTH) return { error: `Comments must be ${MAX_COMMENT_LENGTH} characters or fewer.` }
  return { content }
}
