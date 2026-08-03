import { jsonOptions, platformRequest } from './platformApi'

const queryString = (values = {}) => {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value !== '' && value !== undefined && value !== null) params.set(key, value) })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const getAdminAnalytics = (token) => platformRequest('/admin/analytics', { token })
export const getAdminSummary = getAdminAnalytics
export const getAdminApplications = (token, filters = {}) => platformRequest(`/admin/creator-applications${queryString(typeof filters === 'string' ? { status: filters } : filters)}`, { token })
export const updateApplicationStatus = (id, values, token) => platformRequest(`/admin/creator-applications/${encodeURIComponent(id)}/status`, jsonOptions('PATCH', values, token))
export const getAdminCreators = (token, filters = {}) => platformRequest(`/admin/creators${queryString(filters)}`, { token })
export const getAdminUsers = (token, filters = {}) => platformRequest(`/admin/users${queryString(filters)}`, { token })
export const updateCreatorStatus = (id, creatorAccessStatus, token, reason = '') => platformRequest(`/admin/creators/${encodeURIComponent(id)}/status`, jsonOptions('PATCH', { creatorAccessStatus, reason }, token))
export const updateUserStatus = (id, accountStatus, token, reason = '') => platformRequest(`/admin/users/${encodeURIComponent(id)}/status`, jsonOptions('PATCH', { accountStatus, reason }, token))
export const getAdminSongs = (token, filters = {}) => platformRequest(`/admin/songs${queryString(filters)}`, { token })
export const publishAdminSong = (id, note, token) => platformRequest(`/admin/songs/${encodeURIComponent(id)}/publish`, jsonOptions('POST', { note }, token))
export const unpublishAdminSong = (id, reason, token) => platformRequest(`/admin/songs/${encodeURIComponent(id)}/unpublish`, jsonOptions('POST', { reason }, token))
export const archiveAdminSong = (id, reason, token) => platformRequest(`/admin/songs/${encodeURIComponent(id)}/archive`, jsonOptions('POST', { reason }, token))
export const restoreAdminSong = (id, token) => platformRequest(`/admin/songs/${encodeURIComponent(id)}/restore`, jsonOptions('POST', {}, token))
export const getAdminFolders = (token, filters = {}) => platformRequest(`/admin/folders${queryString(typeof filters === 'string' ? { status: filters } : filters)}`, { token })
export const createPlatformFolder = (values, token) => platformRequest('/admin/folders', jsonOptions('POST', values, token))
export const updateAdminFolder = (id, values, token) => platformRequest(`/admin/folders/${encodeURIComponent(id)}`, jsonOptions('PATCH', values, token))
export const getFolderSongProposals = (token, filters = {}) => platformRequest(`/admin/folder-song-proposals${queryString(filters)}`, { token })
export const reviewFolderSongProposal = (id, values, token) => platformRequest(`/admin/folder-song-proposals/${encodeURIComponent(id)}`, jsonOptions('PATCH', values, token))
export const assignSongToFolder = (folderId, songId, songOrder, token) => platformRequest(`/admin/folders/${encodeURIComponent(folderId)}/songs/${encodeURIComponent(songId)}`, jsonOptions('PUT', { songOrder }, token))
export const removeSongFromFolder = (folderId, songId, token) => platformRequest(`/admin/folders/${encodeURIComponent(folderId)}/songs/${encodeURIComponent(songId)}`, { method: 'DELETE', token })
export const getSafetyReports = (token, filters = {}) => platformRequest(`/admin/safety-reports${queryString(filters)}`, { token })
export const resolveSafetyReport = (id, values, token) => platformRequest(`/admin/safety-reports/${encodeURIComponent(id)}/resolve`, jsonOptions('POST', values, token))
export const getModerationFlags = (token, filters = {}) => platformRequest(`/admin/moderation-flags${queryString(filters)}`, { token })
export const reviewModerationFlag = (id, values, token) => platformRequest(`/admin/moderation-flags/${encodeURIComponent(id)}/review`, jsonOptions('PATCH', values, token))
export const getWarnings = (token, filters = {}) => platformRequest(`/admin/warnings${queryString(filters)}`, { token })
export const issueWarning = (values, token) => platformRequest('/admin/warnings', jsonOptions('POST', values, token))
export const resolveWarning = (id, resolutionNote, token) => platformRequest(`/admin/warnings/${encodeURIComponent(id)}/resolve`, jsonOptions('PATCH', { resolutionNote }, token))
export const transitionWarningStatus = (id, values, token) => platformRequest(`/admin/warnings/${encodeURIComponent(id)}/status`, jsonOptions('PATCH', values, token))
export const getModerationActions = (token, filters = {}) => platformRequest(`/admin/moderation-actions${queryString(filters)}`, { token })
export const getAuditLogs = (token, filters = {}) => platformRequest(`/admin/audit-logs${queryString(filters)}`, { token })
