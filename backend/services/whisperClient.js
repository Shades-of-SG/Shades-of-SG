const { OpenAI } = require('openai')

let client

function getWhisperClient() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OpenAI Whisper transcription is not configured.')
    error.status = 503
    throw error
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 1,
      timeout: 30000,
    })
  }

  return client
}

function resetWhisperClientForTests() {
  if (process.env.NODE_ENV === 'test') client = undefined
}

module.exports = { getWhisperClient, resetWhisperClientForTests }
