const { getDeepSeekClient, getDeepSeekModel } = require('./deepseekClient')

const RETRYABLE_STATUSES = new Set([408, 409, 429])

function structuredError(message, code, cause) {
  const error = new Error(message, cause ? { cause } : undefined)
  error.code = code
  return error
}

function parseJsonResponse(content) {
  const raw = String(content || '').trim()
  if (!raw) throw structuredError('DeepSeek returned an empty response.', 'EMPTY_LLM_RESPONSE')

  const unwrapped = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')

  try {
    return JSON.parse(unwrapped)
  } catch (cause) {
    throw structuredError('DeepSeek returned malformed JSON.', 'MALFORMED_LLM_JSON', cause)
  }
}

function isRetryable(error) {
  const status = Number(error?.status || error?.statusCode)
  return RETRYABLE_STATUSES.has(status)
    || status >= 500
    || ['APIConnectionError', 'APIConnectionTimeoutError'].includes(error?.name)
    || ['ETIMEDOUT', 'ECONNRESET', 'EMPTY_LLM_RESPONSE', 'MALFORMED_LLM_JSON'].includes(error?.code)
    || error?.name?.endsWith('ValidationError')
}

async function requestDeepSeekJson({
  client = getDeepSeekClient(),
  maxTokens = 4096,
  purpose = 'structured generation',
  system,
  user,
  validate = (value) => value,
}) {
  let lastError

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const repairInstruction = attempt
        ? `\n\nThe previous response was invalid (${lastError.message}). Return one corrected, complete JSON object only.`
        : ''
      const response = await client.chat.completions.create({
        model: getDeepSeekModel(),
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: `${system}\nReturn valid JSON only, with no Markdown or commentary.` },
          { role: 'user', content: `${user}${repairInstruction}` },
        ],
        // The installed Node SDK sends provider extensions directly. Python's
        // extra_body wrapper is not part of the JavaScript request shape.
        thinking: { type: 'disabled' },
      })
      return validate(parseJsonResponse(response.choices?.[0]?.message?.content))
    } catch (error) {
      lastError = error
      if (attempt === 1 || !isRetryable(error)) break
    }
  }

  const error = structuredError(`DeepSeek ${purpose} failed: ${lastError?.message || 'Unknown provider error.'}`, 'DEEPSEEK_GENERATION_FAILED', lastError)
  error.status = Number(lastError?.status || lastError?.statusCode) || 502
  throw error
}

module.exports = { isRetryable, parseJsonResponse, requestDeepSeekJson }
