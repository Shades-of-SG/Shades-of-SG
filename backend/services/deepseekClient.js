const { OpenAI } = require('openai')

const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-pro'
const DEFAULT_DEEPSEEK_TIMEOUT_MS = 30000

let client

function getDeepSeekConfigStatus() {
  return {
    baseURL: process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL,
    configured: Boolean(process.env.DEEPSEEK_API_KEY),
    model: process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL,
  }
}

function getDeepSeekClient() {
  if (!process.env.DEEPSEEK_API_KEY) {
    const error = new Error('DEEPSEEK_API_KEY is not configured')
    error.status = 503
    throw error
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL,
      maxRetries: 0,
      timeout: DEFAULT_DEEPSEEK_TIMEOUT_MS,
    })
  }

  return client
}

function getDeepSeekModel() {
  return process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL
}

function resetDeepSeekClientForTests() {
  if (process.env.NODE_ENV === 'test') client = undefined
}

module.exports = {
  DEFAULT_DEEPSEEK_BASE_URL,
  DEFAULT_DEEPSEEK_MODEL,
  getDeepSeekClient,
  getDeepSeekConfigStatus,
  getDeepSeekModel,
  resetDeepSeekClientForTests,
}
