import { jsonOptions, platformRequest } from './platformApi'

export function getMyCreatorApplications(token) {
  return platformRequest('/creator-applications/mine', { token }).then((data) => data.applications)
}

export function submitCreatorApplication(values, token) {
  return platformRequest('/creator-applications', jsonOptions('POST', values, token)).then((data) => data.application)
}

