const mockOpenAI = jest.fn((options) => ({ options }));

jest.mock('openai', () => ({ OpenAI: mockOpenAI }));

describe('provider-specific AI clients', () => {
  const originalDeepSeekKey = process.env.DEEPSEEK_API_KEY
  const originalDeepSeekBaseUrl = process.env.DEEPSEEK_BASE_URL
  const originalDeepSeekModel = process.env.DEEPSEEK_MODEL
  const originalOpenAIKey = process.env.OPENAI_API_KEY

  afterEach(() => {
    jest.resetModules()
    mockOpenAI.mockClear()
    if (originalDeepSeekKey === undefined) delete process.env.DEEPSEEK_API_KEY; else process.env.DEEPSEEK_API_KEY = originalDeepSeekKey
    if (originalDeepSeekBaseUrl === undefined) delete process.env.DEEPSEEK_BASE_URL; else process.env.DEEPSEEK_BASE_URL = originalDeepSeekBaseUrl
    if (originalDeepSeekModel === undefined) delete process.env.DEEPSEEK_MODEL; else process.env.DEEPSEEK_MODEL = originalDeepSeekModel
    if (originalOpenAIKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalOpenAIKey
  })

  test('configures DeepSeek with its own key, base URL, and model', () => {
    process.env.DEEPSEEK_API_KEY = 'deepseek-test-key'
    process.env.DEEPSEEK_BASE_URL = 'https://deepseek.example'
    process.env.DEEPSEEK_MODEL = 'deepseek-v4-pro'
    const { getDeepSeekClient, getDeepSeekConfigStatus } = require('../services/deepseekClient')

    getDeepSeekClient()
    expect(mockOpenAI).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: 'deepseek-test-key', baseURL: 'https://deepseek.example', maxRetries: 0,
    }))
    expect(getDeepSeekConfigStatus()).toMatchObject({ configured: true, model: 'deepseek-v4-pro' })
  })

  test('keeps Whisper on the OpenAI default endpoint', () => {
    process.env.OPENAI_API_KEY = 'openai-test-key'
    const { getWhisperClient } = require('../services/whisperClient')

    getWhisperClient()
    expect(mockOpenAI).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'openai-test-key' }))
    expect(mockOpenAI.mock.calls[0][0]).not.toHaveProperty('baseURL')
  })

  test('reports missing provider keys separately', () => {
    delete process.env.DEEPSEEK_API_KEY
    delete process.env.OPENAI_API_KEY
    const { getDeepSeekClient } = require('../services/deepseekClient')
    const { getWhisperClient } = require('../services/whisperClient')

    expect(() => getDeepSeekClient()).toThrow('DEEPSEEK_API_KEY')
    expect(() => getWhisperClient()).toThrow('Whisper')
  })
})
