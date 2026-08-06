import { jsonOptions, platformRequest } from './platformApi'

export function completeInstrumentChallenge(challengeId, token) {
  return platformRequest(`/instrument-playground/challenges/${encodeURIComponent(challengeId)}/complete`, jsonOptions('POST', {}, token))
}

export async function getInstrumentChallengeProgress(token) {
  const data = await platformRequest('/instrument-playground/challenges/progress', { token })
  return data.completedChallengeIds || []
}
