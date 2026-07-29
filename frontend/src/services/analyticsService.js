import { jsonOptions, platformRequest } from './platformApi'

export const getCreatorAnalytics = (token, songId = '') => platformRequest(`/analytics/creator${songId ? `?songId=${encodeURIComponent(songId)}` : ''}`, { token })

export const trackAnalyticsEvent = (eventType, values = {}, token = '') => platformRequest('/analytics/events', jsonOptions('POST', { eventType, ...values }, token))
