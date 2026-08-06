import { jsonOptions, platformRequest } from './platformApi'

export const trackAnalyticsEvent = (eventType, values = {}, token = '') => platformRequest('/analytics/events', jsonOptions('POST', { eventType, ...values }, token))
