import { jsonOptions, platformRequest } from './platformApi'

export const getAdminAnalytics = (token) => platformRequest('/admin/analytics', { token })
export const getAdminApplications = (token, status = '') => platformRequest(`/admin/creator-applications${status ? `?status=${encodeURIComponent(status)}` : ''}`, { token })
export const updateApplicationStatus = (id, values, token) => platformRequest(`/admin/creator-applications/${encodeURIComponent(id)}/status`, jsonOptions('PATCH', values, token))
export const getAdminCreators = (token) => platformRequest('/admin/creators', { token }).then((data) => data.creators)
export const updateCreatorStatus = (id, accountStatus, token) => platformRequest(`/admin/creators/${encodeURIComponent(id)}/status`, jsonOptions('PATCH', { accountStatus }, token))
export const getAdminFolders = (token, status = '') => platformRequest(`/admin/folders${status ? `?status=${encodeURIComponent(status)}` : ''}`, { token }).then((data) => data.folders)
export const createPlatformFolder = (values, token) => platformRequest('/admin/folders', jsonOptions('POST', values, token))
export const updateAdminFolder = (id, values, token) => platformRequest(`/admin/folders/${encodeURIComponent(id)}`, jsonOptions('PATCH', values, token))
export const getWarnings = (token) => platformRequest('/admin/warnings', { token })
export const issueWarning = (values, token) => platformRequest('/admin/warnings', jsonOptions('POST', values, token))
export const resolveWarning = (id, resolutionNote, token) => platformRequest(`/admin/warnings/${encodeURIComponent(id)}/resolve`, jsonOptions('PATCH', { resolutionNote }, token))
export const getModerationActions = (token) => platformRequest('/admin/moderation-actions', { token })
export const getAuditLogs = (token) => platformRequest('/admin/audit-logs', { token })

