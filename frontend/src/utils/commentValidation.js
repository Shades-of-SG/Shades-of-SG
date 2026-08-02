export const MAX_COMMENT_LENGTH = 500

const PROHIBITED_TOKENS = new Set([
  'asshole', 'bastard', 'bitch', 'cunt', 'dick', 'fuck', 'fucker', 'fucking',
  'motherfucker', 'shit', 'slut', 'whore',
])

export function normalizeCommentContent(value) {
  return typeof value === 'string' ? value.normalize('NFKC').replace(/\s+/g, ' ').trim() : ''
}

export function validateCommentContent(value) {
  const content = normalizeCommentContent(value)
  if (!content) return { error: 'Write a comment before posting.' }
  if ([...content].length > MAX_COMMENT_LENGTH) return { error: `Comments must be ${MAX_COMMENT_LENGTH} characters or fewer.` }
  const tokens = content.toLocaleLowerCase('en-SG')
    .replace(/[@4]/g, 'a').replace(/[!1]/g, 'i').replace(/3/g, 'e').replace(/0/g, 'o')
    .match(/[\p{L}\p{N}]+/gu) || []
  if (tokens.some((token) => PROHIBITED_TOKENS.has(token))) {
    return { error: 'Please revise your comment so it follows our community guidelines.' }
  }
  return { content }
}
