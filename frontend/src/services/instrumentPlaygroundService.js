import { jsonOptions, platformRequest } from './platformApi'

export function completeInstrumentChallenge(challengeId, token) {
  return platformRequest(`/instrument-playground/challenges/${encodeURIComponent(challengeId)}/complete`, jsonOptions('POST', {}, token))
}
