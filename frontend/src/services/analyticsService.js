import { platformRequest } from './platformApi'

export const getCreatorAnalytics = (token) => platformRequest('/analytics/creator', { token })
