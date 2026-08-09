import { platformRequest } from './platformApi'

export async function getLeaderboard({
  difficulty = '',
  songId = '',
  period = 'all-time',
  token = '',
  songPage = 1,
  songSearch = '',
}) {
  const params = new URLSearchParams()

  if (songId) params.set('songId', songId)
  if (difficulty) params.set('difficulty', difficulty)

  params.set('period', period)
  params.set('songPage', songPage)
  params.set('songLimit', 20)
  if (songSearch.trim()) params.set('songSearch', songSearch.trim())

  return platformRequest(`/scores/leaderboard?${params.toString()}`, { token })
}
