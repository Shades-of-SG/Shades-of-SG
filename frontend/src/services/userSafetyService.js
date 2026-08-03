import { jsonOptions, platformRequest } from './platformApi'

export const getMySafetyStatus = (token) => platformRequest('/safety/account-status', { token })
export const acknowledgeMyWarning = (warningId, token) => platformRequest(`/safety/warnings/${encodeURIComponent(warningId)}/acknowledge`, jsonOptions('PATCH', {}, token))
export const markSafetyNotificationRead = (notificationId, token) => platformRequest(`/safety/notifications/${encodeURIComponent(notificationId)}/read`, jsonOptions('PATCH', {}, token))
