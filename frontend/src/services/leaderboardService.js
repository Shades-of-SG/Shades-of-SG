import { platformRequest } from './platformApi'

export async function getLeaderboard({
  difficulty = '',
  songId = '',
  period = 'all-time',
  token = '',
}) {
  const params = new URLSearchParams()

  if (songId) params.set('songId', songId)
  if (difficulty) params.set('difficulty', difficulty)

  params.set('period', period)

  return platformRequest(`/scores/leaderboard?${params.toString()}`, { token })
}
