import { platformRequest } from './platformApi'

export function getApprovedFolders() {
  return platformRequest('/folders').then((data) => data.folders)
}

export function getPublicFolder(slug) {
  return platformRequest(`/folders/${encodeURIComponent(slug)}`).then((data) => data.folder)
}
