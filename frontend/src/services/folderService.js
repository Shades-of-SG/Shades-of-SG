import { jsonOptions, platformRequest } from './platformApi'

export function getApprovedFolders() {
  return platformRequest('/folders').then((data) => data.folders)
}

export function getPublicFolder(slug) {
  return platformRequest(`/folders/${encodeURIComponent(slug)}`).then((data) => data.folder)
}

export function getMyFolderProposals(token) {
  return platformRequest('/folders/proposals/mine', { token }).then((data) => data.folders)
}

export function proposeFolder(values, token) {
  return platformRequest('/folders/proposals', jsonOptions('POST', values, token)).then((data) => data.folder)
}

export function proposeSongPlacement(values, token) {
  return platformRequest('/folders/placements', jsonOptions('POST', values, token)).then((data) => data.proposal)
}

export function getMySongPlacementProposals(token) {
  return platformRequest('/folders/placements/mine', { token }).then((data) => data.proposals)
}

export function updateSongPlacementProposal(id, values, token) {
  return platformRequest(`/folders/placements/${encodeURIComponent(id)}`, jsonOptions('PATCH', values, token)).then((data) => data.proposal)
}
