import { jsonOptions, platformRequest } from './platformApi'

export function getApprovedFolders() {
  return platformRequest('/folders').then((data) => data.folders)
}

export function getMyFolderProposals(token) {
  return platformRequest('/folders/proposals/mine', { token }).then((data) => data.folders)
}

export function proposeFolder(values, token) {
  return platformRequest('/folders/proposals', jsonOptions('POST', values, token)).then((data) => data.folder)
}

export function attachSongFolder(songId, folderId, token) {
  return platformRequest(`/folders/song/${encodeURIComponent(songId)}/${encodeURIComponent(folderId)}`, { method: 'PUT', token })
}

export function detachSongFolder(songId, folderId, token) {
  return platformRequest(`/folders/song/${encodeURIComponent(songId)}/${encodeURIComponent(folderId)}`, { method: 'DELETE', token })
}

